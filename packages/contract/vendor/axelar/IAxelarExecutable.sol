// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAxelarGateway} from "./IAxelarGateway.sol";

/**
 * @title IAxelarExecutable
 * @dev Interface for a contract that is executable by Axelar Gateway's cross-chain message passing.
 * It defines a standard interface to execute commands sent from another chain.
 */
interface IAxelarExecutable {
    /**
     * @dev Thrown when a function is called with an invalid address.
     */
    error InvalidAddress();

    /**
     * @dev Thrown when the call is not approved by the Axelar Gateway.
     */
    error NotApprovedByGateway();

    /**
     * @notice Returns the address of the AxelarGateway contract.
     * @return The Axelar Gateway contract associated with this executable contract.
     */
    function gateway() external view returns (IAxelarGateway);

    /**
     * @notice Executes the specified command sent from another chain.
     * @dev This function is called by the Axelar Gateway to carry out cross-chain commands.
     * Reverts if the call is not approved by the gateway or other checks fail.
     * @param commandId The identifier of the command to execute.
     * @param sourceChain The name of the source chain from where the command originated.
     * @param sourceAddress The address on the source chain that sent the command.
     * @param payload The payload of the command to be executed. This typically includes the function selector and encoded arguments.
     */
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external;
}
