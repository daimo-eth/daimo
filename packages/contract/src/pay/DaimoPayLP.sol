// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "./DaimoPay.sol";
import "./TokenUtils.sol";

/*
 * Liquidity provider contract that funds completes DaimoPay actions.
 */
contract DaimoPayLP is Ownable2Step {
    using SafeERC20 for IERC20;

    constructor(address _owner) Ownable(_owner) {}

    // Handles two cases:
    // Exact output: input extra tokens from owner to make up for difference
    // Exact input: output extra tokens from owner to make up for difference
    function swapAndTip(
        // supplied comes from the user, required is the gap we need to fill with tip.
        TokenAmount calldata requiredTokenIn,
        uint256 suppliedTokenInAmount, // occasionally, user sends less USDC than required. The tipper / owner covers the difference.
        TokenAmount calldata requiredTokenOut,
        uint256 maxTip,
        Call calldata innerSwap
    ) external payable {
        require(tx.origin == owner(), "DPLP: only usable by owner");

        // Claim amountIn from msg.sender & approve swap
        if (address(requiredTokenIn.addr) == address(0)) {
            // Should never require extra input from owner
            require(
                requiredTokenIn.amount == msg.value,
                "DPLP: wrong msg.value"
            );
        } else {
            TokenUtils.transferFrom(
                requiredTokenIn.addr,
                msg.sender,
                address(this),
                suppliedTokenInAmount
            );

            if (suppliedTokenInAmount < requiredTokenIn.amount) {
                // Input more USDC from owner.
                uint256 inShortfall = requiredTokenIn.amount -
                    suppliedTokenInAmount;
                require(inShortfall <= maxTip, "DPLP: excessive tip");
                TokenUtils.transferFrom(
                    requiredTokenIn.addr,
                    owner(),
                    address(this),
                    inShortfall
                );
            }
            // if we're about to send more tokens than required, it's fine --
            // we'll just get more output back, allowing us to account for
            // expected slippage.

            // forceApprove() not necessary, we check correct tokenOut amount
            requiredTokenIn.addr.approve(innerSwap.to, requiredTokenIn.amount);
        }

        // Execute (inner) swap
        uint256 amountPre = TokenUtils.getBalanceOf(
            requiredTokenOut.addr,
            address(this)
        );
        (bool success, ) = innerSwap.to.call{value: innerSwap.value}(
            innerSwap.data
        );
        require(success, "DPLP: inner swap failed");

        uint256 swapAmountOut = TokenUtils.getBalanceOf(
            requiredTokenOut.addr,
            address(this)
        ) - amountPre;

        // Tip the difference; make sure it's not too much.
        if (swapAmountOut < requiredTokenOut.amount) {
            // Output more USDC from owner.
            uint256 outShortfall = requiredTokenOut.amount - swapAmountOut;
            require(outShortfall <= maxTip, "DPLP: excessive tip");
            TokenUtils.transferFrom(
                requiredTokenOut.addr,
                owner(),
                address(this),
                outShortfall
            );
        } else {
            // Input excess tokens to owner.
            uint256 tip = swapAmountOut - requiredTokenOut.amount;
            TokenUtils.transfer(requiredTokenOut.addr, payable(owner()), tip);
        }

        TokenUtils.transfer(
            requiredTokenOut.addr,
            payable(msg.sender),
            requiredTokenOut.amount
        );
    }

    function fastFinish(
        DaimoPay dp,
        PayIntent calldata intent,
        Call[] calldata calls
    ) public onlyOwner {
        TokenUtils.transferFrom(
            intent.bridgeTokenOut.addr,
            msg.sender,
            address(this),
            intent.bridgeTokenOut.amount
        );
        TokenUtils.approve(
            intent.bridgeTokenOut.addr,
            address(dp),
            intent.bridgeTokenOut.amount
        );
        dp.fastFinishAction(intent, calls);
        TokenUtils.approve(intent.bridgeTokenOut.addr, address(dp), 0);
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

        dp.claimAction(intent, calls);
        TokenUtils.transfer(
            intent.bridgeTokenOut.addr,
            payable(msg.sender),
            intent.bridgeTokenOut.amount
        );
    }

    receive() external payable {}
}
