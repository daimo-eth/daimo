// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

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
    constructor(address _owner) {
        transferOwnership(_owner);
    }

    /// Describes the swapbot action to be performed.
    struct SwapbotAction {
        /// The address of the contract to perform the action on, either:
        /// 1. The DAv2 account to take the swap / collect action on.
        /// 2. The FastCCTP contract to take the fastFinish action on.
        address actioneeAddr;
        /// Calldata to be run on the actioneeAddr. E.g. the encoded collect(),
        /// swapToHomeCoin(), or FastFinishTransfer() calldata.
        bytes callData;
        /// Address of the contract that is allowed to spend the tipmaster's
        /// balance (up to maxTokenOutAmount). This is either:
        /// 1. The DaimoFlexSwapper contract, which will perform the swap.
        /// 2. The FastCCTP contract, which will perform the fastFinish action.
        address spenderAddr;
        /// Address of the token to give to the recipient, which is the tokenOut
        /// of the swapbot action. E.g. if the action is a fastCCTPFinish, the
        /// tokenOutAddr is USDC.
        address tokenOutAddr;
        /// The max tokenOut to be spent by the spender. This is in the decimal
        /// of the tokenOut. E.g. if action is a swap, the maxTipAmount is at
        /// most 10_000_000 (= 10 USDC) to tip the recipient.
        uint256 maxTokenOutAmount;
    }

    /// Run the swap action on the DAv2 account. Only callable by the owner.
    function run(bytes calldata swapbotAction) external onlyOwner {
        // Decode the swapbotAction
        SwapbotAction memory action;
        action = abi.decode(swapbotAction, (SwapbotAction));
        IERC20 tokenOut = IERC20(action.tokenOutAddr);

        // Allow the spender to spend the maxTokenOutAmount
        tokenOut.approve(action.spenderAddr, action.maxTokenOutAmount);

        // Run the swapbot action on the DAv2 account or FastCCTP contract
        (bool success, ) = action.actioneeAddr.call(action.callData);
        require(success, "SwapbotTipmaster: swap action failed");

        // Set the allowance back to 0
        tokenOut.approve(action.spenderAddr, 0);
    }
}
