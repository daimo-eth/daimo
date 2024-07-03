// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// Swaps assets automatically. More precisely, it lets any market maker swap
/// swap tokens for a destination token, ensuring a fair price.
interface IDaimoSwapper {
    /// Called to swap tokenIn to tokenOut. Ensures fair price or reverts.
    /// @param extraData swap route or similar, depending on implementation
    function swapToCoin(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) external returns (uint256 amountOut);
}
