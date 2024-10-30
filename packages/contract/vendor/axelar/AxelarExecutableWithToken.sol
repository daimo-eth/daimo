// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAxelarGatewayWithToken} from "./IAxelarGatewayWithToken.sol";
import {IAxelarExecutableWithToken} from "./IAxelarExecutableWithToken.sol";
import {AxelarExecutable} from "./AxelarExecutable.sol";

/**
 * @title AxelarExecutableWithToken
 * @dev Abstract contract to be inherited by contracts that need to execute cross-chain commands involving tokens via Axelar's Gateway.
 * It extends AxelarExecutable and implements the IAxelarExecutableWithToken interface.
 */
abstract contract AxelarExecutableWithToken is
    IAxelarExecutableWithToken,
    AxelarExecutable
{
    /**
     * @dev Contract constructor that sets the Axelar Gateway With Token address and initializes AxelarExecutable.
     * @param gateway_ The address of the Axelar Gateway With Token contract.
     */
    constructor(address gateway_) AxelarExecutable(gateway_) {}

    /**
     * @notice Executes the cross-chain command with token transfer after validating it with the Axelar Gateway.
     * @dev This function ensures the call is approved by Axelar Gateway With Token before execution.
     * It uses a hash of the payload for validation and calls _executeWithToken for the actual command execution.
     * Reverts if the validation fails.
     * @param commandId The unique identifier of the cross-chain message being executed.
     * @param sourceChain The name of the source chain from which the message originated.
     * @param sourceAddress The address on the source chain that sent the message.
     * @param payload The payload of the message payload.
     * @param tokenSymbol The symbol of the token to be transferred.
     * @param amount The amount of tokens to be transferred.
     */
    function executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) external virtual {
        bytes32 payloadHash = keccak256(payload);

        if (
            !gatewayWithToken().validateContractCallAndMint(
                commandId,
                sourceChain,
                sourceAddress,
                payloadHash,
                tokenSymbol,
                amount
            )
        ) revert NotApprovedByGateway();

        _executeWithToken(
            commandId,
            sourceChain,
            sourceAddress,
            payload,
            tokenSymbol,
            amount
        );
    }

    /**
     * @dev Internal virtual function to be overridden by child contracts to execute the command with token transfer.
     * It allows child contracts to define their custom command execution logic involving tokens.
     * @param commandId The unique identifier of the cross-chain message being executed.
     * @param sourceChain The name of the source chain from which the message originated.
     * @param sourceAddress The address on the source chain that sent the message.
     * @param payload The payload of the message payload.
     * @param tokenSymbol The symbol of the token to be transferred.
     * @param amount The amount of tokens to be transferred.
     */
    function _executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal virtual;

    /**
     * @notice Returns the address of the IAxelarGatewayWithToken contract.
     * @return The Axelar Gateway with Token instance.
     */
    function gatewayWithToken()
        internal
        view
        returns (IAxelarGatewayWithToken)
    {
        return IAxelarGatewayWithToken(gatewayAddress);
    }
}
