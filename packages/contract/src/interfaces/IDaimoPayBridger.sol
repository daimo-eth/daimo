// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @notice Bridges assets automatically. Specifically, it lets any market maker
/// initiate a bridge transaction to another chain.
interface IDaimoPayBridger {
    /// @dev Initiates a bridge. Guarantees that (toToken, toAmount) shows up
    ///      in (toAddress) on (toChainId). Otherwise, reverts.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata extraData
    ) external;
}
