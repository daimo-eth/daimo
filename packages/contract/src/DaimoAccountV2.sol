// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/interfaces/IERC1271.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

import "account-abstraction/core/Helpers.sol";
import "account-abstraction/interfaces/IAccount.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "p256-verifier/WebAuthn.sol";

import "./interfaces/IDaimoSwapper.sol";
import "./interfaces/IDaimoBridger.sol";

/// @title V2 of Daimo's account contract
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// DaimoAccountV2 is a collector structure in which the contract is deployed at
/// the same address on every chain but declares one home chain. The account's
/// assets are stored on the home chain in the form of the account's home coin.
/// Any account contract on a foreign chain (a non-home chain) is a collector.
///
/// Collector accounts serve one purpose: to funnel an account's assets on
/// foreign chains to the home chain. Any asset received on a foreign chain is
/// automatically swapped to the bridge coin (if necessary), bridged to the
/// home chain, and then swapped to the home coin (if necessary).
///
/// An account can be deactivated by setting a forwarding address that all
/// future received assets will be forwarded to. collect() and forward() support
/// the native asset (eg ETH) and ERC-20 tokens only, no NFTs.
contract DaimoAccountV2 is IAccount, Initializable, IERC1271, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Represents an arbitrary contract call on the home chain.
    struct Call {
        address dest;
        uint256 value;
        bytes data;
    }

    // Signature, including the key slot identifying the signing key.
    // See WebAuthn.sol for verification details.
    struct Signature {
        uint8 keySlot;
        bytes authenticatorData;
        string clientDataJSON;
        uint256 r;
        uint256 s;
    }

    /// no-op function with struct as argument to expose it in generated ABI
    /// for client-side usage
    function signatureStruct(Signature memory sig) public {}

    /// Account automatically collects funds on this chain.
    /// Immutable after account initialization.
    uint256 public homeChain;

    /// If non-zero, the account auto-swaps to this coin on the homeChain.
    /// Only used on home chain. Editable by the account owner.
    IERC20 public homeCoin;

    /// If non-zero, automatically forwards all assets to forwardingAddress,
    /// deactivating the account's own functionality. Only used on home chain.
    address payable public forwardingAddress;

    /// Swaps assets to the bridgeable coin or the home coin.
    IDaimoSwapper public swapper;

    /// Forwards assets from foreign chains to homeChain.
    IDaimoBridger public bridger;

    /// DaimoAccountV2 is a 1-of-n multisig using P256/WebAuthn keys.
    mapping(uint8 keySlot => bytes32[2]) public keys;

    /// See keys. This is equal to the number of non-zero key slots.
    uint8 public numActiveKeys;

    /// Invariant: numActiveKeys <= maxKeys
    uint8 public constant maxKeys = 20;

    // Deployment-time state, used by all accounts.
    IEntryPoint public immutable entryPoint;

    /// Emitted during initialization = on upgradeTo() this implementation.
    event AccountInitialized(
        IEntryPoint indexed entryPoint,
        uint256 homeChain,
        IERC20 homeCoin,
        IDaimoSwapper swapper,
        IDaimoBridger bridger
    );

    /// Emitted on adding a new signing key (add device).
    event SigningKeyAdded(uint8 keySlot, bytes32[2] key);

    /// Emitted on removing a signing key (remove device).
    event SigningKeyRemoved(uint8 keySlot, bytes32[2] key);

    /// Emitted on foreign chains (auto-swap as part of collect) and home chain
    /// (auto-swap to home coin).
    event AutoSwap(
        IERC20 indexed tokenIn,
        uint256 amountIn,
        IERC20 indexed tokenOut,
        uint256 amountOut
    );

    /// Emitted on foreign chains when we initiate a bridge to home chain.
    event Collect(
        IERC20 indexed tokenIn,
        uint256 amountIn,
        IERC20 indexed tokenBridge,
        uint256 amountBridge,
        uint256 indexed toChainID
    );

    /// Emitted at most once, when account offboards to a forwarding address.
    event SetForwardingAddress(address forwardingAddress);

    /// Emitted after offboarding: forward an asset to the forwarding address.
    event ForwardAsset(IERC20 indexed tokenIn, uint256 indexed amountIn);

    /// Emitted on home chain, when the user updates their home coin.
    event UpdateHomeCoin(
        IERC20 indexed oldHomeCoin,
        IERC20 indexed newHomeCoin
    );

    /// Verify caller is the 4337 EntryPoint. Used to validate & run userops.
    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "DAv2: only entry point");
        _;
    }

    /// Verify that we're in a valid userop, called via executeBatch.
    modifier onlySelf() {
        require(msg.sender == address(this), "DAv2: only self");
        _;
    }

    /// Verify that the account is active, not forwarding, and that
    /// we're on the home chain.
    modifier onlyActiveAndHomeChain() {
        require(forwardingAddress == address(0), "DAv2: only not forwarding");
        require(block.chainid == homeChain, "DAv2: only home chain");
        _;
    }

    modifier onlyHomeChain() {
        require(block.chainid == homeChain, "DAv2: only home chain");
        _;
    }

    modifier onlyForeignChain() {
        require(block.chainid != homeChain, "DAv2: only foreign chain");
        _;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// Runs at deploy time. Singleton implementation contract = no init, no
    /// state. All other methods are called via proxy = initialized once, has
    /// state.
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        _disableInitializers();
    }

    /// Initializes a new account. Intended to be called with CREATE2 to
    /// enshrine the account's home chain in the address on all chains.
    function initialize(
        uint256 _homeChain,
        IERC20 _homeCoin,
        IDaimoSwapper _swapper,
        IDaimoBridger _bridger,
        uint8 slot,
        bytes32[2] calldata key
    ) public virtual initializer {
        homeChain = _homeChain;
        homeCoin = _homeCoin;
        swapper = _swapper;
        bridger = _bridger;

        emit AccountInitialized(
            entryPoint,
            homeChain,
            homeCoin,
            swapper,
            bridger
        );

        // Only the home account ever has signing keys.
        if (block.chainid == homeChain) {
            _addSigningKey(slot, key);
        }
    }

    /// Execute multiple calls atomically. Used on home chain only.
    /// All user-initiated account actions originate from here.
    function executeBatch(
        Call[] calldata calls
    ) external onlyEntryPoint onlyActiveAndHomeChain {
        for (uint256 i = 0; i < calls.length; ++i) {
            _call(calls[i].dest, calls[i].value, calls[i].data);
        }
    }

    function _call(address target, uint256 value, bytes memory data) private {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /// Validation for userops.
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    )
        external
        virtual
        override
        onlyEntryPoint
        onlyActiveAndHomeChain
        returns (uint256 validationData)
    {
        validationData = _validateUseropSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /// Validate userop by verifying a Daimo account signature.
    function _validateUseropSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) private view returns (uint256 validationData) {
        // userOp.signature structure:
        // 6 bytes (uint48)         : validUntil
        // n bytes (type Signature) : signature
        uint256 sigLength = userOp.signature.length;
        if (sigLength < 6) return SIG_VALIDATION_FAILED;

        uint48 validUntil = uint48(bytes6(userOp.signature[0:6]));
        bytes calldata signature = userOp.signature[6:];

        // 38-byte challenge: [uint48 validUntil, bytes32 userOpHash]
        bytes memory challenge = abi.encodePacked(validUntil, userOpHash);

        if (_validateSignature(challenge, signature)) {
            ValidationData memory validData;
            validData.validUntil = validUntil;
            return _packValidationData(validData);
        }
        return SIG_VALIDATION_FAILED;
    }

    /// Validate any Daimo account signature, whether for a userop or 1271 sig.
    function _validateSignature(
        bytes memory challenge,
        bytes calldata signatureBytes
    ) private view returns (bool) {
        Signature memory sig = abi.decode(signatureBytes, (Signature));

        // Retrieve pubkey to verify against
        uint256 x = uint256(keys[sig.keySlot][0]);
        uint256 y = uint256(keys[sig.keySlot][1]);

        return
            WebAuthn.verifySignature({
                challenge: challenge,
                authenticatorData: sig.authenticatorData,
                requireUserVerification: false,
                clientDataJSON: sig.clientDataJSON,
                r: sig.r,
                s: sig.s,
                x: x,
                y: y
            });
    }

    /// Prefund the entrypoint (msg.sender) gas for this transaction.
    /// Only used if there's no paymaster.
    function _payPrefund(uint256 missingAccountFunds) private {
        if (missingAccountFunds == 0) return;
        _sendNativeToken(payable(msg.sender), missingAccountFunds);
    }

    /// Safely send native token, eg ETH or MATIC.
    function _sendNativeToken(address payable to, uint256 value) private {
        (bool ok, ) = to.call{value: value}(new bytes(0));
        require(ok, "DAv2: native token transfer failed");
    }

    /// ERC-1271: validate a Daimo user signature. The signature is an
    /// ABI-encoded Signature struct.
    ///
    /// Only active (home chain, non-forwarding) accounts can sign messages.
    /// isValidSignature() reverts on foreign chains and on inactive accounts.
    function isValidSignature(
        bytes32 message,
        bytes calldata signature
    )
        external
        view
        override
        onlyActiveAndHomeChain
        returns (bytes4 magicValue)
    {
        // 52-byte challenge: [bytes20 address, bytes32 message]
        bytes memory challenge = abi.encodePacked(address(this), message);
        if (_validateSignature(challenge, signature)) {
            return IERC1271(this).isValidSignature.selector;
        }
        return 0xffffffff;
    }

    /// Key management functions.
    /// Fetch all current signing keys (current devices).
    function getActiveSigningKeys()
        public
        view
        returns (
            bytes32[2][] memory activeSigningKeys,
            uint8[] memory activeSigningKeySlots
        )
    {
        activeSigningKeys = new bytes32[2][](numActiveKeys);
        activeSigningKeySlots = new uint8[](numActiveKeys);
        uint256 activeKeyIdx = 0;
        for (uint256 i = 0; i < 256; ++i) {
            uint8 slot = uint8(i);
            if (keys[slot][0] != bytes32(0)) {
                activeSigningKeys[activeKeyIdx] = keys[slot];
                activeSigningKeySlots[activeKeyIdx] = slot;
                activeKeyIdx++;
            }
        }
        assert(activeKeyIdx == numActiveKeys);
    }

    /// Add a signing key to the account.
    /// @param slot the empty slot index to use for this key
    /// @param key the P256 public key to add
    function addSigningKey(
        uint8 slot,
        bytes32[2] memory key
    ) public onlySelf onlyActiveAndHomeChain {
        _addSigningKey(slot, key);
    }

    function _addSigningKey(uint8 slot, bytes32[2] memory key) private {
        require(keys[slot][0] == bytes32(0), "DAv2: key already exists");
        require(key[0] != bytes32(0), "DAv2: new key cannot be 0");
        require(numActiveKeys < maxKeys, "DAv2: max keys reached");

        keys[slot] = key;
        numActiveKeys++;

        emit SigningKeyAdded(slot, key);
    }

    /// Remove a signing key from the account.
    /// @param slot the slot of the key to remove
    function removeSigningKey(
        uint8 slot
    ) public onlySelf onlyActiveAndHomeChain {
        require(keys[slot][0] != bytes32(0), "DAv2: key does not exist");
        require(numActiveKeys > 1, "DAv2: cannot remove only signing key");

        bytes32[2] memory currentKey = keys[slot];
        keys[slot] = [bytes32(0), bytes32(0)];
        numActiveKeys--;

        emit SigningKeyRemoved(slot, currentKey);
    }

    /// Swap (if necessary) and bridge to home chain. Called on foreign chains.
    /// Input token 0x0 refers to the native token. Bridge token cannot be 0x0.
    function collect(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenBridge,
        bytes calldata extraDataSwap,
        bytes calldata extraDataBridge
    ) public onlyForeignChain nonReentrant {
        uint256 amountBridge;
        if (tokenIn == tokenBridge) {
            amountBridge = amountIn;
        } else {
            // Swapper is responsible for ensuring a fair price
            amountBridge = _swap(tokenIn, amountIn, tokenBridge, extraDataSwap);
        }

        // Bridger is responsible for checking that it supports tokenBridge, etc
        tokenBridge.forceApprove(address(bridger), amountBridge);
        bridger.sendToChain(
            tokenBridge,
            amountBridge,
            homeChain,
            extraDataBridge
        );

        emit Collect(tokenIn, amountIn, tokenBridge, amountBridge, homeChain);
    }

    /// Account owner can edit their home coin. Used only on the home chain.
    function updateHomeCoin(
        IERC20 newHomeCoin
    ) public onlySelf onlyActiveAndHomeChain {
        require(newHomeCoin != homeCoin, "DAv2: same coin");
        emit UpdateHomeCoin(homeCoin, newHomeCoin);
        homeCoin = newHomeCoin;
    }

    /// Swap to home coin, if any. Called only on the home chain.
    // Input token 0x0 refers to the native token.
    function swapToHomeCoin(
        IERC20 tokenIn,
        uint256 amountIn,
        bytes calldata extraData
    ) public onlyHomeChain nonReentrant {
        require(address(homeCoin) != address(0), "DAv2: no home coin");
        _swap(tokenIn, amountIn, homeCoin, extraData);
    }

    /// Swap on behalf of the account. This can happen either foreign chain, as
    /// part of a collect(), or on home chain, as part of a swapToHomeCoin().
    function _swap(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) private returns (uint256 amountOut) {
        require(amountIn > 0, "DAv2: amountIn is zero");
        require(address(tokenOut) != address(0), "DAv2: tokenOut is zero");

        uint256 value = 0;
        if (address(tokenIn) == address(0)) {
            value = amountIn; // native token
        } else {
            tokenIn.forceApprove(address(swapper), amountIn);
        }
        amountOut = swapper.swapToCoin{value: value}({
            tokenIn: tokenIn,
            amountIn: amountIn,
            tokenOut: tokenOut,
            extraData: extraData
        });

        emit AutoSwap(tokenIn, amountIn, tokenOut, amountOut);
    }

    /// Set the forwarding address for received assets on the account to be
    /// forwarded to, effectively deprecating the account.
    function setForwardingAddress(
        address payable newAddr
    ) public onlySelf onlyActiveAndHomeChain {
        require(newAddr != address(0), "DAv2: forwarding address cannot be 0");
        require(newAddr != address(this), "DAv2: cannot forward to self");

        forwardingAddress = newAddr;

        emit SetForwardingAddress(newAddr);
    }

    /// Forward assets from the account to the forwarding address.
    function forward(IERC20 tokenIn) public nonReentrant {
        // Reentrancy guard not strictly necessary here, but used everywhere an
        // arbitrary unauthenticated caller can call this contract.
        require(forwardingAddress != address(0), "DAv2: not forwarding");

        uint256 balance;
        if (address(tokenIn) == address(0)) {
            balance = address(this).balance;
            _sendNativeToken(forwardingAddress, balance); // send ETH, AVAX, etc
        } else {
            balance = tokenIn.balanceOf(address(this));
            tokenIn.safeTransfer(forwardingAddress, balance); // send ERC-20
        }

        emit ForwardAsset(tokenIn, balance);
    }
}
