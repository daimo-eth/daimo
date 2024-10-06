// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

/** Utility functions that work for both ERC20 and native tokens. */
library TokenUtils {
    using SafeERC20 for IERC20;

    /** Returns ERC20 or ETH balance. */
    function getBalanceOf(
        IERC20 token,
        address addr
    ) internal view returns (uint256) {
        if (address(token) == address(0)) {
            return addr.balance;
        } else {
            return token.balanceOf(addr);
        }
    }

    /** Approves a token transfer. */
    function approve(IERC20 token, address spender, uint256 amount) internal {
        if (address(token) != address(0)) {
            token.approve(spender, amount);
        } // Do nothing for native token.
    }

    /** Sends an ERC20 or ETH transfer. For ETH, verify call success. */
    function transfer(
        IERC20 token,
        address payable recipient,
        uint256 amount
    ) internal {
        if (address(token) != address(0)) {
            token.safeTransfer(recipient, amount);
        } else {
            // Native token transfer
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "TokenUtils: ETH transfer failed");
        }
    }
}
