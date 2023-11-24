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
/// Requires a server-signed ticket whitelisting each sender address.
contract DaimoPaymaster is BasePaymaster {
    mapping(address => bool) public destWhitelist;
    address public ticketSigner;

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

    function setTicketSigner(address _ticketSigner) public onlyOwner {
        ticketSigner = _ticketSigner;
    }

    struct PaymasterTicketData {
        uint48 validUntil;
        address sender;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
    }

    // no-op function with struct as arguments to expose it in generated ABI
    // for client-side usage
    function paymasterTicketData(PaymasterTicketData memory data) public {}

    function _verifyUserOpTicket(
        UserOperation calldata userOp,
        PaymasterTicketData memory data
    ) internal view {
        require(
            data.validUntil >= block.timestamp,
            "DaimoPaymaster: ticket expired"
        );
        require(
            data.sender == userOp.sender,
            "DaimoPaymaster: ticket sender mismatch"
        );
        require(
            data.callGasLimit >= userOp.callGasLimit,
            "DaimoPaymaster: ticket callGasLimit too low"
        );
        require(
            data.verificationGasLimit >= userOp.verificationGasLimit,
            "DaimoPaymaster: ticket verificationGasLimit too low"
        );
        require(
            data.preVerificationGas >= userOp.preVerificationGas,
            "DaimoPaymaster: ticket preVerificationGas too low"
        );
        require(
            data.maxFeePerGas >= userOp.maxFeePerGas,
            "DaimoPaymaster: ticket maxFeePerGas too low"
        );
        require(
            data.maxPriorityFeePerGas >= userOp.maxPriorityFeePerGas,
            "DaimoPaymaster: ticket maxPriorityFeePerGas too low"
        );
    }

    struct PaymasterTicket {
        uint8 v;
        bytes32 r;
        bytes32 s;
        PaymasterTicketData data;
    }

    // no-op function with struct as arguments to expose it in generated ABI
    // for client-side usage
    function paymasterTicket(PaymasterTicket memory ticket) public {}

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Ticket attests that the sender is allowed to use this paymaster
        // and allowed whitelisted gas limits.
        PaymasterTicket memory ticket = abi.decode(
            userOp.paymasterAndData[20:],
            (PaymasterTicket)
        );

        // Verify userOp gas constants against ticket
        _verifyUserOpTicket(userOp, ticket.data);

        // Verify ticket signature
        bytes32 tHash = keccak256(abi.encode(ticket.data));
        address recoveredSigner = ecrecover(
            tHash,
            ticket.v,
            ticket.r,
            ticket.s
        );
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
            "",
            _packValidationData({
                sigFailed: false, // sig did not fail
                validUntil: ticket.data.validUntil,
                validAfter: 0
            })
        );
    }
}
