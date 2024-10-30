// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAxelarGateway} from "./IAxelarGateway.sol";
import {IAxelarExecutable} from "./IAxelarExecutable.sol";

/**
 * @title AxelarExecutable
 * @dev Abstract contract to be inherited by contracts that need to execute cross-chain commands via Axelar's Gateway.
 * It implements the IAxelarExecutable interface.
 */
abstract contract AxelarExecutable is IAxelarExecutable {
    /// @dev Reference to the Axelar Gateway contract.
    address internal immutable gatewayAddress;

    /**
     * @dev Contract constructor that sets the Axelar Gateway address.
     * Reverts if the provided address is the zero address.
     * @param gateway_ The address of the Axelar Gateway contract.
     */
    constructor(address gateway_) {
        if (gateway_ == address(0)) revert InvalidAddress();

        gatewayAddress = gateway_;
    }

    /**
     * @notice Executes the cross-chain command after validating it with the Axelar Gateway.
     * @dev This function ensures the call is approved by Axelar Gateway before execution.
     * It uses a hash of the payload for validation and internally calls _execute for the actual command execution.
     * Reverts if the validation fails.
     * @param commandId The unique identifier of the cross-chain message being executed.
     * @param sourceChain The name of the source chain from which the message originated.
     * @param sourceAddress The address on the source chain that sent the message.
     * @param payload The payload of the message payload.
     */
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external virtual {
        bytes32 payloadHash = keccak256(payload);

        if (
            !gateway().validateContractCall(
                commandId,
                sourceChain,
                sourceAddress,
                payloadHash
            )
        ) revert NotApprovedByGateway();

        _execute(commandId, sourceChain, sourceAddress, payload);
    }

    /**
     * @dev Internal virtual function to be overridden by child contracts to execute the command.
     * It allows child contracts to define their custom command execution logic.
     * @param commandId The identifier of the command to execute.
     * @param sourceChain The name of the source chain from which the command originated.
     * @param sourceAddress The address on the source chain that sent the command.
     * @param payload The payload of the command to be executed.
     */
    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;

    /**
     * @notice Returns the address of the AxelarGateway contract.
     * @return The Axelar Gateway instance.
     */
    function gateway() public view returns (IAxelarGateway) {
        return IAxelarGateway(gatewayAddress);
    }
}
