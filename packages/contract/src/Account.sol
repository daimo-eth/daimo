// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";

import "account-abstraction/core/BaseAccount.sol";

import "./P256SHA256.sol";

struct Call {
    address dest;
    uint256 value;
    bytes data;
}

/**
 * Daimo account.
 *  has execute, eth handling methods
 *  has many P256 account keys that can send requests through the entryPoint.
 *
 * TODO: doc comments
 * TODO: _authorizeUpgrade
 */
contract Account is BaseAccount, UUPSUpgradeable, Initializable {
    uint8 public numActiveKeys;
    mapping(uint8 => bytes32[2]) public keys; // map of P256 slots -> public keys that own the account

    IEntryPoint private immutable _entryPoint;

    P256SHA256 private immutable _sigVerifier;

    event AccountInitialized(IEntryPoint indexed entryPoint);
    event SigningKeyAdded(
        IAccount indexed account,
        uint8 keySlot,
        bytes32[2] key
    );
    event SigningKeyRemoved(
        IAccount indexed account,
        uint8 keySlot,
        bytes32[2] key
    );

    modifier onlySelf() {
        _onlySelf();
        _;
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(IEntryPoint anEntryPoint, P256SHA256 aSigVerifier) {
        _entryPoint = anEntryPoint;
        _sigVerifier = aSigVerifier;
        _disableInitializers();
    }

    function _onlySelf() internal view {
        // through the account itself (which gets redirected through execute())
        require(msg.sender == address(this), "only self");
    }

    /**
     * execute a sequence of transactions
     */
    function executeBatch(Call[] calldata calls) external {
        _requireFromEntryPoint();
        for (uint256 i = 0; i < calls.length; i++) {
            _call(calls[i].dest, calls[i].value, calls[i].data);
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of Account must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     */
    function initialize(
        uint8 slot,
        bytes32[2] calldata key,
        Call[] calldata initCalls
    ) public virtual initializer {
        _initialize(slot, key, initCalls);
    }

    function _initialize(
        uint8 slot,
        bytes32[2] calldata key,
        Call[] calldata initCalls
    ) internal virtual {
        keys[slot] = key;
        numActiveKeys = 1;

        for (uint256 i = 0; i < initCalls.length; i++) {
            _call(initCalls[i].dest, initCalls[i].value, initCalls[i].data);
        }

        emit AccountInitialized(_entryPoint);
        emit SigningKeyAdded(this, slot, key);
    }

    /// implement template method of BaseAccount
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes memory prefixedHash = bytes.concat(
            "\x19Ethereum Signed Message:\n32",
            userOpHash
        ); // Emulate EIP-712 signing: https://eips.ethereum.org/EIPS/eip-712
        uint8 keySlot = uint8(userOp.signature[0]);
        require(keys[keySlot][0] != bytes32(0), "invalid key slot");
        if (
            _sigVerifier.verify(
                keys[keySlot],
                prefixedHash,
                userOp.signature[1:]
            )
        ) {
            return 0;
        }
        return SIG_VALIDATION_FAILED;
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlySelf {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        (newImplementation);
        _onlySelf();
    }

    /**
     * Fetch all current signing keys
     */
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
        for (uint8 i = 0; i < 255; i++) {
            if (keys[i][0] != bytes32(0)) {
                activeSigningKeys[activeKeyIdx] = keys[i];
                activeSigningKeySlots[activeKeyIdx] = i;
                activeKeyIdx++;
            }
        }
    }

    /**
     * Add a signing key to the account
     * @param slot the slot index to use for this key
     * @param key the P256 public key to add
     */
    function addSigningKey(uint8 slot, bytes32[2] memory key) public onlySelf {
        require(keys[slot][0] == bytes32(0), "key already exists");
        require(key[0] != bytes32(0), "new key cannot be 0");
        require(numActiveKeys < 255, "too many keys");
        require(slot < 255, "invalid slot");
        keys[slot] = key;
        numActiveKeys++;
        emit SigningKeyAdded(this, slot, key);
    }

    /**
     * Remove a signing key from the account
     * @param slot the slot of the key to remove
     */
    function removeSigningKey(uint8 slot) public onlySelf {
        require(keys[slot][0] != bytes32(0), "key does not exist");
        require(numActiveKeys > 1, "cannot remove singular key");
        bytes32[2] memory currentKey = keys[slot];
        keys[slot] = [bytes32(0), bytes32(0)];
        numActiveKeys--;
        emit SigningKeyRemoved(this, slot, currentKey);
    }
}
