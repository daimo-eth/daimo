// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "account-abstraction/core/BasePaymaster.sol";

import "./DaimoAccount.sol";

/// Paymaster contract to sponsor user operations on DaimoAccount, making them
/// free for the user.
/// Pattern matches the calldata pattern of DaimoAccount, sponsoring ops that
/// call executeBatch, and pass to it an arg that's either further making calls
/// into a set of whitelisted contract address (destWhitelist) or to the sender
/// contract itself.
/// Additionally includes a blacklist for senders settable by contract owner.
/// Will not sponsor blacklisted sender ops.
contract DaimoPaymaster is BasePaymaster {
    mapping(address => bool) public destWhitelist;
    mapping(address => bool) public senderBlacklist;

    event UserOperationSponsored(
        bytes32 indexed userOpHash,
        uint256 requiredPreFund
    );

    constructor(
        IEntryPoint _entryPoint,
        address _owner
    ) BasePaymaster(_entryPoint) {
        transferOwnership(_owner);
    }

    function setDestAddressWhitelist(
        address[] calldata addresses,
        bool isWhitelisted
    ) public onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            destWhitelist[addresses[i]] = isWhitelisted;
        }
    }

    function setSenderAddressBlacklist(
        address[] calldata addresses,
        bool isBlacklisted
    ) public onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            senderBlacklist[addresses[i]] = isBlacklisted;
        }
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        require(
            !senderBlacklist[userOp.sender],
            "DaimoPaymaster: sender blacklisted"
        );
        require(userOp.callData.length > 4, "DaimoPaymaster: no callData call");
        bytes4 selector = bytes4(userOp.callData[0:4]);
        require(
            DaimoAccount.executeBatch.selector == selector,
            "DaimoPaymaster: callData not for executeBatch"
        );
        DaimoAccount.Call[] memory calls = abi.decode(
            userOp.callData[4:],
            (DaimoAccount.Call[])
        );
        require(calls.length > 0, "DaimoPaymaster: no calls");
        for (uint256 i = 0; i < calls.length; i++) {
            require(
                destWhitelist[calls[i].dest] || calls[i].dest == userOp.sender,
                "DaimoPaymaster: call dest not whitelisted and not self"
            );
        }

        emit UserOperationSponsored(userOpHash, requiredPreFund);
        return (
            "",
            _packValidationData({
                sigFailed: false, // sig did not fail
                validUntil: 0, // inf
                validAfter: 0
            })
        );
    }
}
