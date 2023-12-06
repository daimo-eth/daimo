// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "account-abstraction/core/BasePaymaster.sol";

import "./DaimoAccount.sol";

/// Coinbase MetaPaymaster
/// See https://github.com/base-org/paymaster/pull/22
interface IMetaPaymaster {
    function fund(address target, uint256 amount) external;
}

/// Paymaster contract to sponsor user operations on DaimoAccount, making them
/// free for the user.
/// Pattern matches the calldata pattern of DaimoAccount, sponsoring ops that
/// call executeBatch, and pass to it an arg that's either further making calls
/// into a set of whitelisted contract address (destWhitelist) or to the sender
/// contract itself.
/// Requires a server-signed ticket whitelisting each sender address.
///
/// This variant uses a parent MetaPaymaster to pay gas.
contract DaimoPaymaster is BasePaymaster {
    mapping(address => bool) public destWhitelist;
    address public ticketSigner;
    IMetaPaymaster public immutable metaPaymaster;

    uint256 private constant POST_OP_OVERHEAD = 34982;

    event UserOperationSponsored(
        bytes32 indexed userOpHash,
        uint256 requiredPreFund
    );

    constructor(
        IEntryPoint _entryPoint,
        address _owner,
        IMetaPaymaster _metaPaymaster
    ) BasePaymaster(_entryPoint) {
        transferOwnership(_owner);
        metaPaymaster = _metaPaymaster;
    }

    function setDestAddressWhitelist(
        address[] calldata addresses,
        bool isWhitelisted
    ) public onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            destWhitelist[addresses[i]] = isWhitelisted;
        }
    }

    function setTicketSigner(address _ticketSigner) public onlyOwner {
        ticketSigner = _ticketSigner;
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Ticket attests that the sender is allowed to use this paymaster
        bytes calldata ticket = userOp.paymasterAndData[20:];
        require(ticket.length == 71, "DaimoPaymaster: invalid ticket length");
        uint8 v = uint8(ticket[0]);
        bytes32 r = bytes32(ticket[1:33]);
        bytes32 s = bytes32(ticket[33:65]);
        uint48 validUntil = uint48(bytes6(ticket[65:]));

        bytes32 tHash = keccak256(abi.encodePacked(userOp.sender, validUntil));
        address recoveredSigner = ecrecover(tHash, v, r, s);
        require(
            recoveredSigner == ticketSigner,
            "DaimoPaymaster: invalid ticket signature"
        );

        // Additionally, only certain calls are sponsored
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
            abi.encode(userOp.maxFeePerGas, userOp.maxPriorityFeePerGas),
            _packValidationData({
                sigFailed: false, // sig did not fail
                validUntil: validUntil,
                validAfter: 0
            })
        );
    }

    // From https://github.com/base-org/paymaster/pull/22
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        if (mode == PostOpMode.postOpReverted) {
            return;
        }
        (uint256 maxFeePerGas, uint256 maxPriorityFeePerGas) = abi.decode(
            context,
            (uint256, uint256)
        );
        uint256 gasPrice = min(
            maxFeePerGas,
            maxPriorityFeePerGas + block.basefee
        );
        metaPaymaster.fund(
            address(this),
            actualGasCost + POST_OP_OVERHEAD * gasPrice
        );
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
