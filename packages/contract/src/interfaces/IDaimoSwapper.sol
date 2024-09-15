// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// Swaps assets automatically. More precisely, it lets any market maker swap
/// swap tokens for a destination token, ensuring a fair price. The input ETH or
/// ERC-20 tokens must be sent to swapper contract ahead of calling swapToCoin,
/// in the same transaction. Output tokens are sent to msg.sender. IDaimoSwapper
/// is used by other contracts; it can't be used from an EOA.
interface IDaimoSwapper {
    /// Called to swap tokenIn to tokenOut. Ensures fair price or reverts.
    /// @param tokenIn input ERC-20 token, 0x0 for native token
    /// @param tokenOut output ERC-20 token, cannot be 0x0
    /// @param extraData swap route or similar, depending on implementation
    function swapToCoin(
        IERC20 tokenIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) external payable returns (uint256 amountOut);
}
