// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import "openzeppelin-contracts/contracts/interfaces/IERC1271.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";

import "account-abstraction/core/Helpers.sol";
import "account-abstraction/interfaces/IAccount.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "p256-verifier/WebAuthn.sol";

import "./DaimoUSDCSwapper.sol";
import "./DaimoCCTPBridger.sol";

/**
 * DaimoAccountV2 is a collector structure in which the contract is deployed at
 * the same address on every chain but declares one home chain. The account's
 * assets are stored on the home chain in the form of the account's home coin.
 * Any account contract on a foreign chains (a non-home chain) is a collector.
 *
 * Collector accounts serve one purpose: to funnel an account's assets on
 * foreign chains to the home chain. Any asset received on a foreign chain is
 * automatically swapped to the bridge coin (if necessary), bridged to the
 * home chain, and then swapped to the home coin (if necessary).
 *
 * An account address can be "upgraded" at most one time by setting a
 * forwarding address that all future received assets will be forwarded to.
 */
contract DaimoAccountV2 is IAccount, Initializable, IERC1271 {
    struct Call {
        address dest;
        uint256 value;
        bytes data;
    }

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
    uint256 public homeChain;

    /// If non-zero, the account auto-swaps to this coin on the homeChain.
    IERC20 public homeCoin;

    /// If non-zero, automatically forwards all assets to forwardingAddress,
    /// disabling the account's own functionality. Only used on home chain.
    address public forwardingAddress;

    /// Swap assets to the bridgeable coin or the home coin.
    IDaimoSwapper public swapper;

    /// Forwards assets from foreign chains to homeChain.
    IDaimoBridger public bridger;

    /// DaimoAccountV2 is a 1-of-n multisig using P256/WebAuthn keys.
    mapping(uint8 => bytes32[2]) public keys;

    /// See keys. This is equal to the number of non-zero key slots.
    uint8 public numActiveKeys;

    /// Invariant: numActiveKeys <= maxKeys
    uint8 public immutable maxKeys = 20;

    // Deployment-time state, used by all accounts.
    IEntryPoint public immutable entryPoint;

    // Return value in case of signature failure.
    // Equivalent to _packValidationData(true,0,0)
    uint256 private constant _SIG_VALIDATION_FAILED = 1;

    /// Emitted during initialization = on upgradeTo() this implementation.
    event AccountInitialized(
        IEntryPoint indexed entryPoint,
        uint256 homeChain,
        IERC20 homeCoin
    );

    /// Emitted on adding a new signing key (add device).
    event SigningKeyAdded(
        IAccount indexed account,
        uint8 keySlot,
        bytes32[2] key
    );

    /// Emitted on removing a signing key (remove device).
    event SigningKeyRemoved(
        IAccount indexed account,
        uint8 keySlot,
        bytes32[2] key
    );

    /// Emitted on foreign coin auto-swap.
    event ForeignCoinSwap(
        uint128 amountIn,
        IERC20 tokenIn,
        uint128 amountOut,
        IERC20 tokenOut
    );

    /// Emitted on foreign chains when we initiate a bridge to home chain.
    event ForeignChainBridge(uint128 amountIn, IERC20 tokenIn);

    /// Emitted on forwarding address changes.
    event ForwardingAddressSet(address forwardingAddress);

    /// Emitted when we forward an asset to the forwarding address.
    event AssetForwarded(uint128 amountIn, IERC20 tokenIn);

    /// Emitted on home chain when we swap an asset to the home coin.
    event HomeChainSwap(uint128 amountIn, IERC20 tokenIn);

    /// Verify caller is the 4337 EntryPoint. Used to validate & run userops.
    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "DAv2: only entry point");
        _;
    }
    /// Verify that we're in a valid userop, called via executeBatch.
    modifier onlyOp() {
        require(msg.sender == address(this), "DAv2: only self");
        require(forwardingAddress == address(0), "DAv2: only not forwarding");
        require(block.chainid == homeChain, "DAv2: only home chain");
        _;
    }

    /// Verify that we're on the home chain & account is active, not forwarding.
    modifier onlyNotForwarding() {
        require(forwardingAddress == address(0), "DAv2: only not forwarding");
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

    /// Initializes a new account -- intended to be called with CREATE2
    /// to enshrine the account's home state in the address.
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
        emit AccountInitialized(entryPoint, homeChain, homeCoin);

        // Only the home account ever has signing keys.
        if (block.chainid == homeChain) {
            keys[slot] = key;
            numActiveKeys = 1;
            emit SigningKeyAdded(this, slot, key);
        }
    }

    /// Execute multiple calls atomically.
    /// All user-initiated account actions originate from here.
    function executeBatch(
        Call[] calldata calls
    ) external onlyEntryPoint onlyNotForwarding {
        for (uint256 i = 0; i < calls.length; i++) {
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
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    )
        external
        virtual
        override
        onlyEntryPoint
        returns (uint256 validationData)
    {
        validationData = _validateUseropSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /// Validate userop by verifying a Daimo account signature.
    function _validateUseropSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) private view returns (uint256 validationData) {
        // userOp.signature bytes structure:
        //
        // - 6 bytes uint48 validUntil
        // - 1 byte uint8 keySlot
        // - (unknown) bytes (type Signature) signature

        // In all cases, we'll be checking a signature & returning a result.
        bytes memory messageToVerify;
        bytes calldata signature;
        ValidationData memory returnIfValid;

        uint256 sigLength = userOp.signature.length;
        if (sigLength < 6) return _SIG_VALIDATION_FAILED;
        uint48 validUntil = uint48(bytes6(userOp.signature[0:6]));

        signature = userOp.signature[6:];
        messageToVerify = abi.encodePacked(validUntil, userOpHash);
        returnIfValid.validUntil = validUntil;

        if (_validateSignature(messageToVerify, signature)) {
            return _packValidationData(returnIfValid);
        }
        return _SIG_VALIDATION_FAILED;
    }

    /// Validate any Daimo account signature, whether for a userop or 1271 sig.
    function _validateSignature(
        bytes memory message,
        bytes calldata signatureBytes
    ) private view returns (bool) {
        // First bit identifies keySlot
        uint8 keySlot = uint8(signatureBytes[0]);

        // If the keySlot is empty, this is an invalid key
        uint256 x = uint256(keys[keySlot][0]);
        uint256 y = uint256(keys[keySlot][1]);

        if (signatureBytes.length == 0) return false;
        Signature memory sig = abi.decode(signatureBytes[1:], (Signature));

        return
            WebAuthn.verifySignature({
                challenge: message,
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
        if (missingAccountFunds > 0) {
            payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
        }
    }

    /// ERC1271: validate a user signature, verifying a valid Daimo account
    /// signature. Signature format: [uint8 keySlot, encoded Signature struct]
    function isValidSignature(
        bytes32 message,
        bytes calldata signature
    ) external view override onlyNotForwarding returns (bytes4 magicValue) {
        if (_validateSignature(bytes.concat(message), signature)) {
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
        uint activeKeyIdx = 0;
        for (uint256 i = 0; i < 256; i++) {
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
    function addSigningKey(uint8 slot, bytes32[2] memory key) public onlyOp {
        require(keys[slot][0] == bytes32(0), "DAv2: key already exists");
        require(key[0] != bytes32(0), "DAv2: new key cannot be 0");
        require(numActiveKeys < maxKeys, "DAv2: max keys reached");
        keys[slot] = key;
        numActiveKeys++;
        emit SigningKeyAdded(this, slot, key);
    }

    /// Remove a signing key from the account.
    /// @param slot the slot of the key to remove
    function removeSigningKey(uint8 slot) public onlyOp {
        require(keys[slot][0] != bytes32(0), "DAv2: key does not exist");
        require(numActiveKeys > 1, "DAv2: cannot remove only signing key");
        bytes32[2] memory currentKey = keys[slot];
        keys[slot] = [bytes32(0), bytes32(0)];
        numActiveKeys--;
        emit SigningKeyRemoved(this, slot, currentKey);
    }

    /// Swap on behalf of the account to a bridgable token.
    function swap(
        uint128 amountIn,
        IERC20 tokenIn,
        bytes calldata extraData
    ) public {
        TransferHelper.safeApprove(
            address(tokenIn),
            address(swapper),
            amountIn
        );
        (uint128 totalAmountOut, IERC20 tokenOut) = swapper.swapToBridgableCoin(
            amountIn,
            tokenIn,
            extraData
        );

        emit ForeignCoinSwap(amountIn, tokenIn, totalAmountOut, tokenOut);
    }

    /// Bridge assets from foreign chains to home chain.
    function bridge(uint128 amountIn, IERC20 tokenIn) public {
        require(
            block.chainid != homeChain,
            "DAv2: bridging only supported on foreign chains"
        );

        TransferHelper.safeApprove(
            address(tokenIn),
            address(bridger),
            amountIn
        );
        bridger.sendToHomeChain(homeChain, tokenIn, amountIn);

        emit ForeignChainBridge(amountIn, tokenIn);
    }

    /// Set the forwarding address for received assets on the account to be
    /// forwarded to, effectively deprecating the account.
    function setForwardingAddress(address newForwardingAddress) public onlyOp {
        require(
            newForwardingAddress != address(0),
            "DAv2: forwarding address cannot be 0"
        );
        require(
            newForwardingAddress != address(this),
            "DAv2: cannot forward to self"
        );

        forwardingAddress = newForwardingAddress;
        emit ForwardingAddressSet(newForwardingAddress);
    }

    /// Forward assets from the account to the forwarding address.
    function forward(IERC20 tokenIn) public {
        require(forwardingAddress != address(0), "DAv2: not forwarding");
        uint256 balance = tokenIn.balanceOf(address(this));
        TransferHelper.safeTransfer(
            address(tokenIn),
            forwardingAddress,
            balance
        );
    }
}
