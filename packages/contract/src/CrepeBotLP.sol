// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "./CrepeFastCCTP.sol";
import "./CrepeUtils.sol";

/*
 * CrepeBotLP is a liquidity provider contract that funds swapbot actions.
 *
 */
contract CrepeBotLP is Ownable2Step {
    using SafeERC20 for IERC20;

    constructor(address _owner) Ownable(_owner) {}

    // Handles two cases:
    // Exact output: input extra USDC from owner to make up for difference
    // Exact input: output extra USDC from owner to make up for difference
    function swapAndTip(
        // supplied comes from the user, required is the gap we need to fill with tip.
        TokenAmount calldata requiredTokenIn,
        uint256 suppliedTokenInAmount, // occasionally, user sends less USDC than required. The tipper / owner covers the difference.
        TokenAmount calldata requiredTokenOut,
        uint256 maxTip,
        Call calldata innerSwap
    ) external payable {
        require(tx.origin == owner(), "DSLP: only usable by owner");

        // Claim amountIn from msg.sender & approve swap
        if (address(requiredTokenIn.addr) == address(0)) {
            // Should never require extra input from owner
            require(
                requiredTokenIn.amount == msg.value,
                "DSLP: wrong msg.value"
            );
        } else {
            CrepeTokenUtils.transferFrom(
                requiredTokenIn.addr,
                msg.sender,
                address(this),
                suppliedTokenInAmount
            );

            if (suppliedTokenInAmount < requiredTokenIn.amount) {
                // Exact output: input extra USDC from owner to make up for difference
                uint256 inShortfall = requiredTokenIn.amount -
                    suppliedTokenInAmount;
                require(inShortfall <= maxTip, "DSLP: excessive tip");
                CrepeTokenUtils.transferFrom(
                    requiredTokenIn.addr,
                    owner(),
                    address(this),
                    inShortfall
                );
            }

            // forceApprove() not necessary, we check correct tokenOut amount
            requiredTokenIn.addr.approve(innerSwap.to, requiredTokenIn.amount);
        }

        // Execute (inner) swap
        uint256 amountPre = CrepeTokenUtils.getBalanceOf(
            requiredTokenOut.addr,
            address(this)
        );
        (bool success, ) = innerSwap.to.call{value: innerSwap.value}(
            innerSwap.data
        );

        uint256 swapAmountOut = CrepeTokenUtils.getBalanceOf(
            requiredTokenOut.addr,
            address(this)
        ) - amountPre;
        require(swapAmountOut > 0, "DSLP: swap produced no output");
        require(swapAmountOut < type(uint128).max, "DSLP: excessive output");
        CrepeTokenUtils.transfer(
            requiredTokenOut.addr,
            payable(msg.sender),
            swapAmountOut
        );

        // Tip the difference; make sure it's not too much.
        if (swapAmountOut < requiredTokenOut.amount) {
            uint256 outShortfall = requiredTokenOut.amount - swapAmountOut;
            require(outShortfall <= maxTip, "DSLP: excessive tip");
            CrepeTokenUtils.transferFrom(
                requiredTokenOut.addr,
                owner(),
                payable(msg.sender),
                outShortfall
            );
        }
    }

    function fastFinish(
        CrepeFastCCTP fc,
        Destination calldata destination,
        Call calldata swapCall
    ) public onlyOwner {
        CrepeTokenUtils.transferFrom(
            destination.mintToken.addr,
            msg.sender,
            address(this),
            destination.mintToken.amount
        );
        CrepeTokenUtils.approve(
            destination.mintToken.addr,
            address(fc),
            destination.mintToken.amount
        );
        fc.fastFinishAction(destination, swapCall);
        CrepeTokenUtils.approve(destination.mintToken.addr, address(fc), 0);
    }

    function claimAndKeep(
        Call calldata mintCall,
        CrepeFastCCTP fc,
        Destination calldata destination,
        Call calldata swapCall
    ) public onlyOwner {
        if (mintCall.data.length > 0) {
            (bool success, ) = mintCall.to.call{value: mintCall.value}(
                mintCall.data
            );
        }

        fc.claimAction(destination, swapCall);
        CrepeTokenUtils.transfer(
            destination.mintToken.addr,
            payable(msg.sender),
            destination.mintToken.amount
        );
    }

    receive() external payable {}
}
