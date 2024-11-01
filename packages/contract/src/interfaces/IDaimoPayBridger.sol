// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "../pay/TokenUtils.sol";

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

    /// @dev Get the bridge route for the given output token options on
    ///      destination chain.
    function getBridgeTokenIn(
        uint256 toChainId,
        TokenAmount[] memory bridgeTokenOutOptions
    ) external view returns (address bridgeTokenIn, uint256 inAmount);

    /// @dev Initiate a bridge. Guarantees that one of the bridge token options
    ///      (bridgeTokenOut, outAmount) shows up in (toAddress) on (toChainId).
    ///      Otherwise, reverts.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        TokenAmount[] memory bridgeTokenOutOptions,
        bytes calldata extraData
    ) external;
}
