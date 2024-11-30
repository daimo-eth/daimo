// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./DaimoPay.sol";
import "./TokenUtils.sol";

/*
 * Relayer contract that funds completes DaimoPay intents.
 */
contract DaimoPayRelayer is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    event SwapAndTip(
        address indexed requiredTokenIn,
        uint256 suppliedAmountIn,
        address indexed requiredTokenOut,
        uint256 swapAmountOut,
        uint256 maxPreTip,
        uint256 maxPostTip
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RELAYER_ROLE, admin);
    }

    // Add a new address that can use the relayer functions.
    function grantRelayerRole(
        address relayer
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RELAYER_ROLE, relayer);
    }

    // Withdraws an amount of tokens from the contract to the admin.
    function withdrawAmount(
        IERC20 token,
        uint256 amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        TokenUtils.transfer(token, payable(msg.sender), amount);
    }

    // Withdraws the full balance of a token from the contract to the admin.
    function withdrawBalance(IERC20 token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        TokenUtils.transferBalance(token, payable(msg.sender));
    }

    // Makes a swap from requiredTokenIn to requiredTokenOut. The relayer "tips"
    // the difference between the required input amount and the input amount
    // supplied by the user to ensure the swap succeeds.
    // The relayer also "tips" the difference between the required output amount
    // and the output amount received from the swap to ensure the output is
    // exactly the amount required.
    function swapAndTip(
        // supplied comes from the user, required is the gap we need to fill with tip.
        TokenAmount calldata requiredTokenIn,
        uint256 suppliedTokenInAmount,
        TokenAmount calldata requiredTokenOut,
        uint256 maxPreTip,
        uint256 maxPostTip,
        Call calldata innerSwap
    ) external payable {
        require(hasRole(RELAYER_ROLE, tx.origin), "DPR: only relayer");

        //////////////////////////////////////////////////////////////
        // PRE-SWAP
        //////////////////////////////////////////////////////////////

        uint256 amountPreSwap = TokenUtils.getBalanceOf(
            requiredTokenOut.token,
            address(this)
        );

        // Check that the amount supplied by the user is exactly suppliedTokenIn.
        // In the case of native token input, the value should've been supplied
        // in msg.value. In the case of ERC20 input, move the tokens using
        // transferFrom.
        if (address(requiredTokenIn.token) == address(0)) {
            // Caller should have supplied the exact amount in msg.value
            require(suppliedTokenInAmount == msg.value, "DPR: wrong msg.value");
            // Inner swap should not require more than the required input amount
            require(
                innerSwap.value <= requiredTokenIn.amount,
                "DPR: wrong inner swap value"
            );
        } else {
            // Transfer the supplied tokens to the contract
            TokenUtils.transferFrom({
                token: requiredTokenIn.token,
                from: msg.sender,
                to: address(this),
                amount: suppliedTokenInAmount
            });
        }

        // Check that the tip doesn't exceed maxPreTip
        if (suppliedTokenInAmount < requiredTokenIn.amount) {
            uint256 inShortfall = requiredTokenIn.amount -
                suppliedTokenInAmount;
            require(inShortfall <= maxPreTip, "DPR: excessive pre tip");
        }

        //////////////////////////////////////////////////////////////
        // SWAP
        //////////////////////////////////////////////////////////////

        // forceApprove() not necessary, we check correct tokenOut amount.
        // Approve requiredTokenIn.amount even if it's greater than
        // suppliedTokenInAmount. The difference is tipped by the contract. We
        // already checked that the tip is within maxPreTip.
        if (innerSwap.to != address(0)) {
            requiredTokenIn.token.approve(innerSwap.to, requiredTokenIn.amount);
        }

        // Execute inner swap
        if (innerSwap.to != address(0)) {
            (bool success, ) = innerSwap.to.call{value: innerSwap.value}(
                innerSwap.data
            );
            require(success, "DPR: inner swap failed");
        }

        uint256 swapAmountOut = TokenUtils.getBalanceOf(
            requiredTokenOut.token,
            address(this)
        ) - amountPreSwap;

        //////////////////////////////////////////////////////////////
        // POST-SWAP
        //////////////////////////////////////////////////////////////

        // If we received less than required, check that the amount we need to
        // tip is within maxPostTip.
        if (swapAmountOut < requiredTokenOut.amount) {
            uint256 outShortfall = requiredTokenOut.amount - swapAmountOut;
            require(outShortfall <= maxPostTip, "DPR: excessive post tip");
        }

        // Transfer the required output tokens to the caller, tipping the
        // shortfall if needed. If there are surplus tokens from the swap, keep
        // them.
        TokenUtils.transfer(
            requiredTokenOut.token,
            payable(msg.sender),
            requiredTokenOut.amount
        );

        emit SwapAndTip({
            requiredTokenIn: address(requiredTokenIn.token),
            suppliedAmountIn: suppliedTokenInAmount,
            requiredTokenOut: address(requiredTokenOut.token),
            swapAmountOut: swapAmountOut,
            maxPreTip: maxPreTip,
            maxPostTip: maxPostTip
        });
    }

    function startIntent(
        Call[] calldata preCalls,
        DaimoPay dp,
        PayIntent calldata intent,
        Call[] calldata startCalls,
        bytes calldata bridgeExtraData,
        Call[] calldata postCalls
    ) public payable onlyRole(RELAYER_ROLE) {
        // Make pre-start calls
        for (uint256 i = 0; i < preCalls.length; ++i) {
            Call calldata call = preCalls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "DPR: preCall failed");
        }

        dp.startIntent({
            intent: intent,
            calls: startCalls,
            bridgeExtraData: bridgeExtraData
        });

        // Make post-start calls
        for (uint256 i = 0; i < postCalls.length; ++i) {
            Call calldata call = postCalls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "DPR: postCall failed");
        }
    }

    function fastFinish(
        DaimoPay dp,
        PayIntent calldata intent,
        TokenAmount calldata tokenIn,
        Call[] calldata calls
    ) public onlyRole(RELAYER_ROLE) {
        TokenUtils.transferFrom({
            token: tokenIn.token,
            from: msg.sender,
            to: address(dp),
            amount: tokenIn.amount
        });
        dp.fastFinishIntent(intent, calls);
    }

    function claimAndKeep(
        Call[] calldata preCalls,
        DaimoPay dp,
        PayIntent calldata intent,
        Call[] calldata claimCalls,
        Call[] calldata postCalls
    ) public onlyRole(RELAYER_ROLE) {
        // Make pre-claim calls
        for (uint256 i = 0; i < preCalls.length; ++i) {
            Call calldata call = preCalls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "DPR: preCall failed");
        }

        dp.claimIntent({intent: intent, calls: claimCalls});

        // Make post-claim calls
        for (uint256 i = 0; i < postCalls.length; ++i) {
            Call calldata call = postCalls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "DPR: postCall failed");
        }

        // Transfer any bridgeTokenOut balance back to the owner
        uint256 n = intent.bridgeTokenOutOptions.length;
        for (uint256 i = 0; i < n; ++i) {
            TokenUtils.transferBalance(
                intent.bridgeTokenOutOptions[i].token,
                payable(msg.sender)
            );
        }
    }

    receive() external payable {}
}
