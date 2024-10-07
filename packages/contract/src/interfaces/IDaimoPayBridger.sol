// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @notice Bridges assets automatically. Specifically, it lets any market maker
/// initiate a bridge transaction to another chain.
interface IDaimoPayBridger {
    /// @notice Emitted when a bridge transaction is initiated
    event BridgeInitiated(
        uint256 indexed toChainId,
        address indexed toAddress,
        address toToken,
        uint256 toAmount,
        address fromToken,
        uint256 fromAmount
    );

    function getInputToken(
        uint256 toChainId,
        address toToken
    ) external view returns (address);

    function getInputAmount(
        uint256 toChainId,
        address toToken,
        uint256 toAmount
    ) external view returns (uint256);

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
