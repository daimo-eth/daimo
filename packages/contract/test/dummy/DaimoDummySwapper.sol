// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../../src/interfaces/IDaimoSwapper.sol";

contract DummySwapper is IDaimoSwapper {
    // Dummy extra data for tip mechanism
    struct DummySwapperExtraData {
        address callDest;
        bytes callData;
    }

    IERC20 public expectedTokenInA;
    IERC20 public expectedTokenOutA;
    IERC20 public expectedTokenInB;
    IERC20 public expectedTokenOutB;

    constructor(
        IERC20 tokenInA,
        IERC20 tokenOutA,
        IERC20 tokenInB,
        IERC20 tokenOutB
    ) {
        expectedTokenInA = tokenInA;
        expectedTokenOutA = tokenOutA;
        expectedTokenInB = tokenInB;
        expectedTokenOutB = tokenOutB;
    }

    function swapToCoin(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) external payable returns (uint256 amountOut) {
        IERC20 expectedTokenIn;
        IERC20 expectedTokenOut;
        if (block.chainid == 10) {
            expectedTokenIn = expectedTokenInA;
            expectedTokenOut = expectedTokenOutA;
        } else if (block.chainid == 8453) {
            expectedTokenIn = expectedTokenInB;
            expectedTokenOut = expectedTokenOutB;
        } else {
            revert("unsupported chain");
        }

        require(tokenIn == expectedTokenIn, "wrong tokenIn");
        require(tokenOut == expectedTokenOut, "wrong tokenOut");
        tokenIn.transferFrom(msg.sender, address(this), amountIn);

        if (extraData.length > 0) {
            // Call the reentrant swapAndTip() function
            DummySwapperExtraData memory data = abi.decode(
                extraData,
                (DummySwapperExtraData)
            );
            tokenIn.approve(data.callDest, amountIn);
            (bool success, ) = data.callDest.call{value: msg.value}(
                data.callData
            );
            require(success, "swapAndTip failed");

            // Send result back to msg.sender
            amountOut = tokenOut.balanceOf(address(this));
            tokenOut.transfer(msg.sender, amountOut);
        } else {
            // Just fake the swap, send back amount directly
            amountOut = amountIn - 3;
            tokenOut.transfer(msg.sender, amountOut);
        }
    }
}
