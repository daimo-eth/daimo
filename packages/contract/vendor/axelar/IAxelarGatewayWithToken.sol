// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAxelarGateway} from "./IAxelarGateway.sol";

/**
 * @title IAxelarGatewayWithToken
 * @dev Interface for the Axelar Gateway that supports cross-chain token transfers coupled with general message passing.
 * It extends IAxelarGateway to include token-related functionality.
 */
interface IAxelarGatewayWithToken is IAxelarGateway {
    /**
     * @notice Emitted when a token is sent to another chain.
     * @dev Logs the attempt to send tokens to a recipient on another chain.
     * @param sender The address of the sender who initiated the token transfer.
     * @param destinationChain The name of the destination chain.
     * @param destinationAddress The address of the recipient on the destination chain.
     * @param symbol The symbol of the token being transferred.
     * @param amount The amount of the tokens being transferred.
     */
    event TokenSent(
        address indexed sender,
        string destinationChain,
        string destinationAddress,
        string symbol,
        uint256 amount
    );

    /**
     * @notice Emitted when a contract call is made through the gateway along with a token transfer.
     * @dev Logs the attempt to call a contract on another chain with an associated token transfer.
     * @param sender The address of the sender who initiated the contract call with token.
     * @param destinationChain The name of the destination chain.
     * @param destinationContractAddress The address of the contract on the destination chain.
     * @param payloadHash The keccak256 hash of the sent payload data.
     * @param payload The payload data used for the contract call.
     * @param symbol The symbol of the token being transferred.
     * @param amount The amount of the tokens being transferred.
     */
    event ContractCallWithToken(
        address indexed sender,
        string destinationChain,
        string destinationContractAddress,
        bytes32 indexed payloadHash,
        bytes payload,
        string symbol,
        uint256 amount
    );

    /**
     * @notice Emitted when a contract call with a token minting is approved.
     * @dev Logs the approval of a contract call that originated from another chain and involves a token minting process.
     * @param commandId The identifier of the command to execute.
     * @param sourceChain The name of the source chain from whence the command came.
     * @param sourceAddress The address of the sender on the source chain.
     * @param contractAddress The address of the contract where the call will be executed.
     * @param payloadHash The keccak256 hash of the approved payload data.
     * @param symbol The symbol of the token being minted.
     * @param amount The amount of the tokens being minted.
     * @param sourceTxHash The hash of the source transaction on the source chain.
     * @param sourceEventIndex The index of the event in the source transaction logs.
     */
    event ContractCallApprovedWithMint(
        bytes32 indexed commandId,
        string sourceChain,
        string sourceAddress,
        address indexed contractAddress,
        bytes32 indexed payloadHash,
        string symbol,
        uint256 amount,
        bytes32 sourceTxHash,
        uint256 sourceEventIndex
    );

    /**
     * @notice Sends tokens to another chain.
     * @dev Initiates a cross-chain token transfer through the gateway to the specified destination chain and recipient.
     * @param destinationChain The name of the destination chain.
     * @param destinationAddress The address of the recipient on the destination chain.
     * @param symbol The symbol of the token being transferred.
     * @param amount The amount of the tokens being transferred.
     */
    function sendToken(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata symbol,
        uint256 amount
    ) external;

    /**
     * @notice Makes a contract call on another chain with an associated token transfer.
     * @dev Initiates a cross-chain contract call through the gateway that includes a token transfer to the specified contract on the destination chain.
     * @param destinationChain The name of the destination chain.
     * @param contractAddress The address of the contract on the destination chain.
     * @param payload The payload data to be used in the contract call.
     * @param symbol The symbol of the token being transferred.
     * @param amount The amount of the tokens being transferred.
     */
    function callContractWithToken(
        string calldata destinationChain,
        string calldata contractAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) external;

    /**
     * @notice Checks if a contract call with token minting is approved.
     * @dev Determines whether a given contract call, identified by the commandId and payloadHash, involving token minting is approved.
     * @param commandId The identifier of the command to check.
     * @param sourceChain The name of the source chain.
     * @param sourceAddress The address of the sender on the source chain.
     * @param contractAddress The address of the contract where the call will be executed.
     * @param payloadHash The keccak256 hash of the payload data.
     * @param symbol The symbol of the token associated with the minting.
     * @param amount The amount of the tokens to be minted.
     * @return True if the contract call with token minting is approved, false otherwise.
     */
    function isContractCallAndMintApproved(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        address contractAddress,
        bytes32 payloadHash,
        string calldata symbol,
        uint256 amount
    ) external view returns (bool);

    /**
     * @notice Validates and approves a contract call with token minting.
     * @dev Validates the given contract call information and marks it as approved if valid. It also involves the minting of tokens.
     * @param commandId The identifier of the command to validate.
     * @param sourceChain The name of the source chain.
     * @param sourceAddress The address of the sender on the source chain.
     * @param payloadHash The keccak256 hash of the payload data.
     * @param symbol The symbol of the token associated with the minting.
     * @param amount The amount of the tokens to be minted.
     * @return True if the contract call with token minting is validated and approved, false otherwise.
     */
    function validateContractCallAndMint(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash,
        string calldata symbol,
        uint256 amount
    ) external returns (bool);

    /**
     * @notice Retrieves the address of a token given its symbol.
     * @dev Gets the contract address of the token registered with the given symbol.
     * @param symbol The symbol of the token to retrieve the address for.
     * @return The contract address of the token corresponding to the given symbol.
     */
    function tokenAddresses(
        string memory symbol
    ) external view returns (address);
}
