// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAxelarExecutable} from "./IAxelarExecutable.sol";

/**
 * @title IAxelarExecutableWithToken
 * @dev Interface for a contract that can execute commands from Axelar Gateway involving token transfers.
 * It extends IAxelarExecutable to include token-related functionality.
 */
interface IAxelarExecutableWithToken is IAxelarExecutable {
    /**
     * @notice Executes the specified command sent from another chain and includes a token transfer.
     * @dev This function should be implemented to handle incoming commands that include token transfers.
     * It will be called by an implementation of `IAxelarGatewayWithToken`.
     * @param commandId The identifier of the command to execute.
     * @param sourceChain The name of the source chain from where the command originated.
     * @param sourceAddress The address on the source chain that sent the command.
     * @param payload The payload of the command to be executed.
     * @param tokenSymbol The symbol of the token to be transferred with this command.
     * @param amount The amount of tokens to be transferred with this command.
     */
    function executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) external;
}
