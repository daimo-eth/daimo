// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

struct TokenAmount {
    IERC20 addr;
    uint256 amount;
}

struct Call {
    address to;
    uint256 value;
    bytes data;
}

// CrepeHandoffAddress commits to the destination data:
// This includes:
// - the exact call to be made
// - the exact output token and amount to be approved with the call
// - a quote for the swaps on the way to the destination
struct Destination {
    uint256 chainId;
    uint32 domain; // CCTP domain
    TokenAmount mintToken; // (mint token, amount) output expected by the user
    TokenAmount finalCallToken; // final approval (token, amount) expected for the call address
    Call finalCall; // call to be made on the destination chain
    address refundAddress; // address to refund tokens if finalCall fails.
    uint256 nonce;
}

// Utility functions for ERC20 tokens that work for both ERC20 and native tokens.
library CrepeTokenUtils {
    using SafeERC20 for IERC20;

    // balanceOf that works for both ERC20 and ETH
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

    function approve(IERC20 token, address spender, uint256 amount) internal {
        if (address(token) != address(0)) {
            token.approve(spender, amount);
        } // Do nothing for native token.
    }

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
            require(success, "CrepeTokenUtils: ETH transfer failed");
        }
    }

    function transferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) internal {
        require(
            address(token) != address(0),
            "CrepeTokenUtils: ETH transferFrom must be caller"
        );
        token.safeTransferFrom(from, to, amount);
    }
}
