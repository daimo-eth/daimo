// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @notice Bridges assets automatically. Specifically, it lets any market maker
/// initiate a bridge transaction to another chain.
interface IDaimoPayBridger {
    /// @notice Emitted when a bridge transaction is initiated
    event BridgeInitiated(
        address fromAddress,
        address fromToken,
        uint256 fromAmount,
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount
    );

    /// @dev Get the input token and amount to bridge for the given output token
    ///      and amount on another chain.
    function getInputTokenAmount(
        uint256 toChainId,
        address toToken,
        uint256 toAmount
    ) external view returns (address inputToken, uint256 inputAmount);

    /// @dev Initiate a bridge. Guarantees that (toToken, toAmount) shows up
    ///      in (toAddress) on (toChainId). Otherwise, reverts.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata extraData
    ) external;
}
