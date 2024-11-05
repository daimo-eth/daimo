// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./TokenUtils.sol";

library TransferTokenBalance {
    event RefundedTokens(
        address indexed recipient,
        address indexed token,
        uint256 indexed amount
    );

    /// Transfer the balance of a token to the recipient.
    function transferBalance(
        IERC20 token,
        address payable recipient
    ) internal returns (uint256 balance) {
        balance = TokenUtils.getBalanceOf({token: token, addr: address(this)});

        if (balance > 0) {
            TokenUtils.transfer({
                token: token,
                recipient: recipient,
                amount: balance
            });
        }
    }

    /// Refunds any leftover tokens in the contract and sends them to the
    /// recipient.
    function refundLeftoverTokens(
        IERC20 token,
        address payable recipient
    ) internal {
        uint256 balance = transferBalance(token, recipient);
        if (balance > 0) {
            emit RefundedTokens({
                recipient: recipient,
                token: address(token),
                amount: balance
            });
        }
    }
}
