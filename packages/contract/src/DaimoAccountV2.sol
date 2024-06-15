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

    // no-op function with struct as argument to expose it in generated ABI
    // for client-side usage
    function signatureStruct(Signature memory sig) public {}

    // Account state
    uint256 public homeChain;
    IERC20 public homeCoin;

    // If non-zero, turns into a forwarding account for forwardingAddress, essentially
    // disabling the account's own functionality.
    // Only used on home chain.
    address public forwardingAddress;

    // Swapper and Bridger contracts, specialized to homeCoin and supported chains.
    IDaimoSwapper public swapper;
    IDaimoBridger public bridger;

    mapping(uint8 => bytes32[2]) public keys;
    uint8 public numActiveKeys;
    uint8 public immutable maxKeys = 20; // Invariant: numActiveKeys <= maxKeys

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

    /// Emitted on bridger actions.
    event ForeignChainBridge(uint128 amountIn, IERC20 tokenIn);

    /// Emitted on forwarding address change.
    event ForwardingAddressChanged(address forwardingAddress);

    modifier onlySelf() {
        require(msg.sender == address(this), "only self");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "only entry point");
        _;
    }

    modifier onlyNotForwarding() {
        require(forwardingAddress == address(0), "only not forwarding");
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

    // Initializes a new account -- intended to be called with CREATE2
    // to enshrine the account's home state in the address.
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
        keys[slot] = key;
        numActiveKeys = 1;

        emit AccountInitialized(entryPoint, homeChain, homeCoin);
        emit SigningKeyAdded(this, slot, key);
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

    function _call(address target, uint256 value, bytes memory data) internal {
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
        // - (unknown) bytes (type Signature) signature

        // In all cases, we'll be checking a signature & returning a result.
        bytes memory messageToVerify;
        bytes calldata signature;
        ValidationData memory returnIfValid;

        uint256 sigLength = userOp.signature.length;
        if (sigLength < 6) return _SIG_VALIDATION_FAILED;
        uint48 validUntil = uint48(bytes6(userOp.signature[0:6]));

        signature = userOp.signature[6:]; // encoded Signature struct
        messageToVerify = abi.encodePacked(validUntil, userOpHash);
        returnIfValid.validUntil = validUntil;

        if (sigLength == 0) return _SIG_VALIDATION_FAILED;

        if (_validateSignature(messageToVerify, signature)) {
            return _packValidationData(returnIfValid);
        }
        return _SIG_VALIDATION_FAILED;
    }

    /// Validate any Daimo account signature, whether for a userop or ERC1271 user sig.
    function _validateSignature(
        bytes memory message,
        bytes calldata signatureBytes
    ) private view returns (bool) {
        // First bit identifies keySlot
        uint8 keySlot = uint8(signatureBytes[0]);

        // If the keySlot is empty, this is an invalid key
        uint256 x = uint256(keys[keySlot][0]);
        uint256 y = uint256(keys[keySlot][1]);

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
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
            (success); // no-op; silence unused variable warning
        }
    }

    /// ERC1271: validate a user signature, verifying a valid Daimo account
    /// signature.
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

    /// Add a signing key to the account
    /// @param slot the empty slot index to use for this key
    /// @param key the P256 public key to add
    function addSigningKey(
        uint8 slot,
        bytes32[2] memory key
    ) public onlySelf onlyNotForwarding {
        require(keys[slot][0] == bytes32(0), "key already exists");
        require(key[0] != bytes32(0), "new key cannot be 0");
        require(numActiveKeys < maxKeys, "max keys reached");
        keys[slot] = key;
        numActiveKeys++;
        emit SigningKeyAdded(this, slot, key);
    }

    /// Remove a signing key from the account
    /// @param slot the slot of the key to remove
    function removeSigningKey(uint8 slot) public onlySelf onlyNotForwarding {
        require(keys[slot][0] != bytes32(0), "key does not exist");
        require(numActiveKeys > 1, "cannot remove only signing key");
        bytes32[2] memory currentKey = keys[slot];
        keys[slot] = [bytes32(0), bytes32(0)];
        numActiveKeys--;
        emit SigningKeyRemoved(this, slot, currentKey);
    }

    /// Swap on behalf of the account
    function swap(
        uint128 amountIn,
        IERC20 tokenIn,
        bytes calldata extraData
    ) public {
        // bytes calldata swapPath,
        // uint128 altruisticAmountOut,
        // address altruisticSender

        require(tokenIn != homeCoin, "cannot swap home coin");

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

        require(tokenOut == homeCoin, "must swap to home coin");

        emit ForeignCoinSwap(amountIn, tokenIn, totalAmountOut, homeCoin);
    }

    /// Bridge
    function bridge(uint128 amountIn, IERC20 tokenIn) public {
        require(
            block.chainid != homeChain,
            "Bridging only supported on foreign chains"
        );

        TransferHelper.safeApprove(
            address(tokenIn),
            address(bridger),
            amountIn
        );
        bridger.sendToHomeChain(homeChain, tokenIn, amountIn);

        emit ForeignChainBridge(amountIn, tokenIn);
    }

    /// Forwarder mode -- meant as a deprecation mechanism for accounts.
    function setForwardingAddress(
        address newForwardingAddress
    ) public onlySelf onlyNotForwarding {
        require(
            newForwardingAddress != address(0),
            "forwarding address cannot be 0"
        );
        require(
            newForwardingAddress != address(this),
            "cannot forward to self"
        );

        forwardingAddress = newForwardingAddress;
        emit ForwardingAddressChanged(newForwardingAddress);
    }

    function forward(uint128 amountIn, IERC20 tokenIn) public {
        require(forwardingAddress != address(0), "not in forwarding mode");
        TransferHelper.safeTransferFrom(
            address(tokenIn),
            msg.sender,
            forwardingAddress,
            amountIn
        );
    }
}
