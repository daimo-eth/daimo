// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IDaimoBridger {
    function swapToHomeChain(
        uint256 homeChain,
        IERC20 tokenIn,
        uint128 amountIn,
        bytes calldata extraData
    ) external;
}
