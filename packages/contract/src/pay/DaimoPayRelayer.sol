// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "./DaimoPay.sol";
import "./TokenUtils.sol";

/*
 * Relayer contract that funds completes DaimoPay intents.
 */
contract DaimoPayRelayer is Ownable2Step {
    using SafeERC20 for IERC20;

    constructor(address _owner) Ownable(_owner) {}

    // Makes a swap from requiredTokenIn to requiredTokenOut. The relayer "tips"
    // the difference between the required input amount and the input amount
    // supplied by the user to ensure the swap succeeds.
    // The relayer also "tips" the difference between the required output amount
    // and the output amount received from the swap.
    function swapAndTip(
        // supplied comes from the user, required is the gap we need to fill with tip.
        TokenAmount calldata requiredTokenIn,
        uint256 suppliedTokenInAmount,
        TokenAmount calldata requiredTokenOut,
        uint256 maxTip,
        Call calldata innerSwap
    ) external payable {
        require(tx.origin == owner(), "DPR: only usable by owner");

        // Check the amount supplied by the user. The contract owner tips the
        // difference if needed
        if (address(requiredTokenIn.token) == address(0)) {
            // Should never require extra input from owner
            require(
                requiredTokenIn.amount == msg.value,
                "DPR: wrong msg.value"
            );
        } else {
            TokenUtils.transferFrom(
                requiredTokenIn.token,
                msg.sender,
                address(this),
                suppliedTokenInAmount
            );

            if (suppliedTokenInAmount < requiredTokenIn.amount) {
                // Input more tokens from the owner up to maxTip to make up for
                // the shortfall so that the swap can go through.
                uint256 inShortfall = requiredTokenIn.amount -
                    suppliedTokenInAmount;
                require(inShortfall <= maxTip, "DPR: excessive tip");
                TokenUtils.transferFrom(
                    requiredTokenIn.token,
                    owner(),
                    address(this),
                    inShortfall
                );
            }
            // If we're about to send more tokens than required, it's fine --
            // we'll just get more output back, allowing us to account for
            // expected slippage.

            // forceApprove() not necessary, we check correct tokenOut amount
            if (innerSwap.to != address(0)) {
                requiredTokenIn.token.approve(
                    innerSwap.to,
                    requiredTokenIn.amount
                );
            }
        }

        // Execute (inner) swap
        uint256 amountPre = TokenUtils.getBalanceOf(
            requiredTokenOut.token,
            address(this)
        );
        if (innerSwap.to != address(0)) {
            (bool success, ) = innerSwap.to.call{value: innerSwap.value}(
                innerSwap.data
            );
            require(success, "DPR: inner swap failed");
        }

        uint256 swapAmountOut = TokenUtils.getBalanceOf(
            requiredTokenOut.token,
            address(this)
        ) - amountPre;

        // Check the amount output from the swap. The contract owner tips the
        // difference if needed. If there are excess tokens, transfer them to
        // the owner.
        if (swapAmountOut < requiredTokenOut.amount) {
            // Output more tokens from owner.
            uint256 outShortfall = requiredTokenOut.amount - swapAmountOut;
            require(outShortfall <= maxTip, "DPR: excessive tip");
            TokenUtils.transferFrom(
                requiredTokenOut.token,
                owner(),
                address(this),
                outShortfall
            );
        } else {
            // Give excess tokens to owner.
            uint256 tip = swapAmountOut - requiredTokenOut.amount;
            TokenUtils.transfer(requiredTokenOut.token, payable(owner()), tip);
        }

        TokenUtils.transfer(
            requiredTokenOut.token,
            payable(msg.sender),
            requiredTokenOut.amount
        );
    }

    function fastFinish(
        DaimoPay dp,
        PayIntent calldata intent,
        TokenAmount calldata tokenIn,
        Call[] calldata calls
    ) public onlyOwner {
        TokenUtils.transferFrom({
            token: tokenIn.token,
            from: msg.sender,
            to: address(dp),
            amount: tokenIn.amount
        });
        dp.fastFinishIntent(intent, calls);
    }

    function claimAndKeep(
        Call calldata mintCall,
        DaimoPay dp,
        PayIntent calldata intent,
        Call[] calldata calls
    ) public onlyOwner {
        if (mintCall.data.length > 0) {
            (bool success, ) = mintCall.to.call{value: mintCall.value}(
                mintCall.data
            );
        }

        dp.claimIntent({intent: intent, calls: calls});
        TokenUtils.transfer({
            token: intent.bridgeTokenOut.token,
            recipient: payable(msg.sender),
            amount: intent.bridgeTokenOut.amount
        });
    }

    receive() external payable {}
}
