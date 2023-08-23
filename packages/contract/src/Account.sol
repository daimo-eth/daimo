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

/**
 * minimal account.
 *  this is sample minimal account.
 *  has execute, eth handling methods
 *  has many P256 account keys that can send requests through the entryPoint.
 */
contract Account is BaseAccount, UUPSUpgradeable, Initializable {
    using ECDSA for bytes32;

    bytes32[2][] public accountKeys; // list of P256 public keys that own the account

    IEntryPoint private immutable _entryPoint;

    P256SHA256 private immutable _sigVerifier;

    event AccountInitialized(IEntryPoint indexed entryPoint);
    event SigningKeyAdded(IAccount indexed account, bytes32[2] accountPubkey);
    event SigningKeyRemoved(IAccount indexed account, bytes32[2] accountPubkey);

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
        //through the account itself (which gets redirected through execute())
        require(msg.sender == address(this), "only self");
    }

    /**
     * execute a transaction (called directly from owner, or by entryPoint)
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _requireFromEntryPoint();
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transactions
     */
    function executeBatch(
        address[] calldata dest,
        bytes[] calldata func
    ) external {
        _requireFromEntryPoint();
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of Account must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     */
    function initialize(
        bytes32[2] calldata accountKey
    ) public virtual initializer {
        _initialize(accountKey);
    }

    function _initialize(bytes32[2] calldata accountKey) internal virtual {
        accountKeys.push(accountKey);
        emit AccountInitialized(_entryPoint);
        emit SigningKeyAdded(this, accountKey);
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
        uint8 keyIdx = uint8(userOp.signature[0]);
        require(keyIdx < accountKeys.length, "invalid key index");
        if (
            _sigVerifier.verify(
                accountKeys[keyIdx],
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
    function getSigningKeys() public view returns (bytes32[2][] memory) {
        return accountKeys;
    }

    /**
     * Add a signing key to the account
     * @param accountPubKey the P256 public key to add
     */
    function addSigningKey(bytes32[2] calldata accountPubKey) public onlySelf {
        require(accountKeys.length < 255, "too many keys");
        accountKeys.push(accountPubKey);
        emit SigningKeyAdded(this, accountPubKey);
    }

    /**
     * Remove a signing key from the account
     * @param accountPubKey the P256 public key to remove
     */
    function removeSigningKey(
        bytes32[2] calldata accountPubKey
    ) public onlySelf {
        require(accountKeys.length > 1, "cannot remove singular key");
        for (uint256 i = 0; i < accountKeys.length; i++) {
            if (
                accountKeys[i][0] == accountPubKey[0] &&
                accountKeys[i][1] == accountPubKey[1]
            ) {
                for (uint256 j = i;j < accountKeys.length - 1; j++) {
                    accountKeys[j] = accountKeys[j + 1];
                }
                accountKeys.pop();
                emit SigningKeyRemoved(this, accountPubKey);
                return;
            }
        }
        revert("key not found");
    }
}
