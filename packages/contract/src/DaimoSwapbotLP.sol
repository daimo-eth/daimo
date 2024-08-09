// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

/*
 * SwapbotLP is a liquidity provider contract that funds swapbot actions.
 * Swapbot actions are either:
 * 1. Swaps or collects on DaimoAccountv2 accounts.
 * 2. FastCCTP fastFinishes or claimTransfers using the FastCCTP contract.
 *
 * In the first case, SwapbotLP acts as a tipmaster that covers a tip such that
 * swaps are executed at a precise, pre-defined rate (i.e. 1:1 for a stablecoin
 * pair swap). In the second case, SwapbotLP acts as an LP that fronts assets
 * for a receiving DAv2 for FastCCTP and later claims minted assets from CCTP.
 *
 * The contract owner is the swapbot EOA, which is the only account that is
 * allowed to invoke SwapbotLP and spend the contract's balance.
 */
contract SwapbotLP is Ownable2Step {
    using SafeERC20 for IERC20;

    constructor(address _owner) Ownable(_owner) {}

    /// Emitted when a swapbot action is run.
    event Run(
        address actioneeAddr,
        bytes callData,
        bool isSwapAndTip,
        address tokenOutAddr,
        bytes32 tipAmounts
    );

    /// Emitted when a swap + tip to exact output action is performed.
    event SwapAndTip(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        address callDest,
        bytes callData,
        uint256 swapAmountOut,
        uint256 totalAmountOut,
        uint256 maxTip
    );

    /// Describes the swapbot action to be performed.
    struct SwapbotAction {
        /// The address of the contract to perform the action on, either:
        /// 1. The DAv2 account to take the swap / collect action on.
        /// 2. The FastCCTP contract to take the fastFinish action on.
        address actioneeAddr;
        /// Calldata to be run on the actioneeAddr. E.g. the encoded collect(),
        /// swapToHomeCoin(), or FastFinishTransfer() calldata.
        bytes callData;
        /// Whether to send tokenOut to actioneeAddr vs waiting for a reentrant
        /// swapAndTip() call.
        bool isSwapAndTip;
        /// Address of the token to give to the recipient, which is the tokenOut
        /// of the swapbot action. E.g. if the action is a fastCCTPFinish, the
        /// tokenOutAddr is USDC.
        address tokenOutAddr;
        /// Packed value.
        /// Hi uint128: the exact total output amount.
        /// Lo uint128: max tokenOut to tip.
        bytes32 tipAmounts;
    }

    address private _curTokenOut;
    bytes32 private _curAmounts;

    /// Run the swap action on the DAv2 account. Only callable by the owner.
    function run(bytes calldata swapbotAction) external onlyOwner {
        // Decode the swapbotAction
        SwapbotAction memory action;
        action = abi.decode(swapbotAction, (SwapbotAction));
        IERC20 tokenOut = IERC20(action.tokenOutAddr);

        // Allow the spender to spend the maxTokenOutAmount
        (uint128 totalAmount, uint128 maxTip) = _unpackHiLo(action.tipAmounts);
        if (action.isSwapAndTip) {
            _curTokenOut = action.tokenOutAddr;
            _curAmounts = action.tipAmounts;
        } else {
            require(maxTip == 0, "DSLP: maxTip must be 0 for non-swapAndTip");
            tokenOut.approve(action.actioneeAddr, uint256(totalAmount));
        }

        // Run the swapbot action on the DAv2 account or FastCCTP contract
        (bool success, ) = action.actioneeAddr.call(action.callData);
        require(success, "DSLP: swap action failed");

        // Set the allowance back to 0
        if (action.isSwapAndTip) {
            _curTokenOut = address(0);
        } else {
            tokenOut.approve(action.actioneeAddr, 0);
        }

        emit Run({
            actioneeAddr: action.actioneeAddr,
            callData: action.callData,
            isSwapAndTip: action.isSwapAndTip,
            tokenOutAddr: action.tokenOutAddr,
            tipAmounts: action.tipAmounts
        });
    }

    /// Reentrant call from DaimoFlexSwapper. Swap + pay or receive tip.
    /// @param callDest Swap contract to call.
    /// @param callData Calldata to pass to the swap.
    function swapAndTip(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        address callDest,
        bytes calldata callData
    ) external payable {
        // Check that we're in context of a run()
        require(_curTokenOut != address(0), "DSLP: not reentrant");
        require(_curTokenOut == address(tokenOut), "DSLP: wrong tokenOut");
        (uint128 totalAmountOut, uint128 maxTip) = _unpackHiLo(_curAmounts);

        // If tokenIn is ERC20, claim amountIn from msg.sender & approve swap
        if (address(tokenIn) == address(0)) {
            require(amountIn == msg.value, "DSLP: wrong msg.value");
        } else {
            tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
            // forceApprove() not necessary, we check correct tokenOut amount
            tokenIn.approve(callDest, amountIn);
        }

        // Execute (inner) swap
        uint256 amountPre = tokenOut.balanceOf(address(this));
        (bool success, ) = callDest.call{value: msg.value}(callData);
        require(success, "DSLP: swap failed");

        uint256 swapAmountOut = tokenOut.balanceOf(address(this)) - amountPre;
        require(swapAmountOut > 0, "DSLP: swap produced no output");
        require(swapAmountOut < type(uint128).max, "DSLP: excessive output");

        // Tip the difference; make sure it's not too much. May be negative.
        // Guaranteed not to overflow, both sides verified to fit in uint128.
        int256 shortfall = int256(uint256(totalAmountOut)) -
            int256(swapAmountOut);
        assert(shortfall < int256(uint256(maxTip)));

        // Send exact amount out
        tokenOut.transfer(msg.sender, totalAmountOut);

        emit SwapAndTip({
            tokenIn: address(tokenIn),
            amountIn: amountIn,
            tokenOut: address(tokenOut),
            callDest: callDest,
            callData: callData,
            swapAmountOut: swapAmountOut,
            totalAmountOut: totalAmountOut,
            maxTip: maxTip
        });
    }

    /// Helper function to unpack the packed tipAmounts value.
    function _unpackHiLo(
        bytes32 packed
    ) private pure returns (uint128 hi, uint128 lo) {
        hi = uint128(uint256(packed) >> 128);
        lo = uint128(uint256(packed));
    }
}
