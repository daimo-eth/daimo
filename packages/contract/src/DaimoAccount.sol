// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";

import "account-abstraction/interfaces/IAccount.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "./DaimoP256SHA256.sol";

struct Call {
    address dest;
    uint256 value;
    bytes data;
}

/**
 * Daimo ERC-4337 contract account.
 *
 * Implements a 1-of-n multisig with P256 keys. Supports key rotation.
 */
contract DaimoAccount is IAccount, UUPSUpgradeable, Initializable {
    /// Number of keys. 1-of-n multisig, n = numActiveKeys
    uint8 public numActiveKeys;
    /// Map of slot to key. Invariant: exactly n slots are nonzero.
    mapping(uint8 => bytes32[2]) public keys;

    /// The ERC-4337 entry point singleton
    IEntryPoint public immutable entryPoint;
    /// P256 (secp256r1) signature verifier
    P256SHA256 public immutable sigVerifier;
    /// Maximum number of signing keys
    uint8 public immutable maxKeys = 20;

    // Return value in case of signature failure, with no time-range.
    // Equivalent to _packValidationData(true,0,0)
    uint256 private constant _SIG_VALIDATION_FAILED = 1;

    /// Emitted during initialization = on upgradeTo() this implementation.
    event AccountInitialized(IEntryPoint indexed entryPoint);

    /// Emitted after adding a new signing key (add device).
    event SigningKeyAdded(
        IAccount indexed account,
        uint8 keySlot,
        bytes32[2] key
    );

    /// Emitted after removing a signing key (remove device).
    event SigningKeyRemoved(
        IAccount indexed account,
        uint8 keySlot,
        bytes32[2] key
    );

    modifier onlySelf() {
        require(msg.sender == address(this), "only self");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "only entry point");
        _;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// Runs at deploy time. Implementation contract = no init, no state.
    /// All other methods are called via proxy = initialized once, has state.
    constructor(IEntryPoint anEntryPoint, P256SHA256 aSigVerifier) {
        entryPoint = anEntryPoint;
        sigVerifier = aSigVerifier;
        _disableInitializers();
    }

    /// Initialize proxy contract storage.
    function initialize(
        bytes32[2] calldata key,
        Call[] calldata initCalls
    ) public virtual initializer {
        uint8 slot = 0;
        keys[slot] = key;
        numActiveKeys = 1;

        for (uint256 i = 0; i < initCalls.length; i++) {
            _call(initCalls[i].dest, initCalls[i].value, initCalls[i].data);
        }

        emit AccountInitialized(entryPoint);
        emit SigningKeyAdded(this, slot, key);
    }

    /// Execute multiple transactions atomically.
    function executeBatch(Call[] calldata calls) external onlyEntryPoint {
        for (uint256 i = 0; i < calls.length; i++) {
            _call(calls[i].dest, calls[i].value, calls[i].data);
        }
    }

    /// Check that the P256 signature is valid for this user operation.
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
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /// Validate userop by verifying a P256 signature.
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) private view returns (uint256 validationData) {
        uint8 keySlot = uint8(userOp.signature[0]);
        require(keys[keySlot][0] != bytes32(0), "invalid key slot");
        bytes memory opHash = abi.encodePacked(userOpHash);
        if (sigVerifier.verify(keys[keySlot], opHash, userOp.signature[1:])) {
            // TODO: validUntil?
            return 0;
        }
        return _SIG_VALIDATION_FAILED;
    }

    /// Prefund the entrypoint (msg.sender) gas for this transaction.
    function _payPrefund(uint256 missingAccountFunds) private {
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
            (success); // no-op; silence unused variable warning
        }
    }

    /// All account actions originate from here.
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /// UUPSUpsgradeable: only allow self-upgrade.
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override onlySelf {
        (newImplementation); // No-op; silence unused parameter warning
    }

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
        for (uint8 i = 0; i < maxKeys; i++) {
            if (keys[i][0] != bytes32(0)) {
                activeSigningKeys[activeKeyIdx] = keys[i];
                activeSigningKeySlots[activeKeyIdx] = i;
                activeKeyIdx++;
            }
        }
        assert(activeKeyIdx == numActiveKeys);
    }

    /// Add a signing key to the account
    /// @param slot the empty slot index to use for this key
    /// @param key the P256 public key to add
    function addSigningKey(uint8 slot, bytes32[2] memory key) public onlySelf {
        require(keys[slot][0] == bytes32(0), "key already exists");
        require(key[0] != bytes32(0), "new key cannot be 0");
        require(slot < maxKeys, "invalid slot");
        keys[slot] = key;
        numActiveKeys++;
        emit SigningKeyAdded(this, slot, key);
    }

    /// Remove a signing key from the account
    /// @param slot the slot of the key to remove
    function removeSigningKey(uint8 slot) public onlySelf {
        require(keys[slot][0] != bytes32(0), "key does not exist");
        require(numActiveKeys > 1, "cannot remove only signing key");
        bytes32[2] memory currentKey = keys[slot];
        keys[slot] = [bytes32(0), bytes32(0)];
        numActiveKeys--;
        emit SigningKeyRemoved(this, slot, currentKey);
    }
}
