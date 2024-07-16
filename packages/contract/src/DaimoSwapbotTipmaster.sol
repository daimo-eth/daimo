// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/*
 * SwapbotTipmaster is a helper contract that allows the swapbot to run swap
 * actions on DaimoAccountv2 accounts. The contract owner is the hot-wallet
 * EOA that covers the tips such that a swap can be executed at a precise,
 * pre-defined rate (e.g. 1:1 for a stablecoin pair swap).
 */
contract SwapbotTipmaster is Ownable2Step {
    constructor(address _owner) {
        transferOwnership(_owner);
    }

    /// Describes the action to be performed on the DAv2 account
    struct SwapAction {
        /// Address of the DAv2 account to take the swap action on.
        address daimoAccountAddr;
        /// Calldata to be performed on the DAv2 account. For example, the encoded
        /// collect() calldata or the encoded swapToHomeCoin() calldata.
        bytes callData;
        /// Address of the DaimoFlexSwapper contract, which will perform the swap.
        /// This is the address allowed to spend the maxTipAmount.
        address swapperAddr;
        /// Address of the token to tip the recipient. This is the tokenOut of
        /// the swap action that the swapper performs.
        address tokenTipAddr;
        /// Max tip amount to be spent by the swapper. This is in the denomination
        // of the tokenOut in the swap call. For example, if the tokenOut is USDC,
        /// the maxTipAmount will be at most 10_000_000 (= 10 USDC).
        uint256 maxTipAmount;
    }

    /// Run the swap action on the DAv2 account. Only callable by the owner.
    function run(bytes calldata swapAction) external onlyOwner {
        // Decode the swapAction
        SwapAction memory action;
        action = abi.decode(swapAction, (SwapAction));
        IERC20 tokenTip = IERC20(action.tokenTipAddr);

        // Allow the swapper to spend the maxTipAmount
        tokenTip.approve(action.swapperAddr, action.maxTipAmount);

        // Run the swap action on the DAv2 account
        (bool success, ) = action.daimoAccountAddr.call(action.callData);
        require(success, "SwapbotTipmaster: swap action failed");

        // Set the allowance back to 0
        tokenTip.approve(action.swapperAddr, 0);
    }
}
