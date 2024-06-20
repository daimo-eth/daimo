// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IDaimoSwapper {
  // Note: bridgable coin = home coin on home chain, but bridgeable coin may
  // not equal homecoin on foreign chains since same token may have a different
  // address on different chains.
  function swapToBridgableCoin(
    uint128 amountIn,
    IERC20 tokenIn,
    bytes calldata extraData
  ) external returns (uint128 totalAmountOut, IERC20 tokenOut);
}
