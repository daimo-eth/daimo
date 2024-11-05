// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract TokenBalanceUtils is Ownable {
    IERC20[] public tokens;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function getAllTokens() public view returns (IERC20[] memory) {
        return tokens;
    }

    function setTokens(IERC20[] memory _tokens) public onlyOwner {
        tokens = _tokens;
    }

    /**
     * @notice Get the balances for all saved tokens and the balance of the
     * native asset for an owner
     * @param owner The owner of the tokens
     * @return balances An array of balances, where the last element is the
     * balance of the native asset
     */
    function getTokenBalances(
        address owner
    ) public view returns (uint256[] memory balances) {
        uint256 n = tokens.length;

        balances = new uint256[](n + 1);
        for (uint256 i = 0; i < n; ++i) {
            balances[i] = tokens[i].balanceOf(owner);
        }

        balances[n] = owner.balance;
    }

    /**
     * @notice Get the balances for a custom list of tokens and the balance of
     * the native asset for an owner
     * @param owner The owner of the tokens
     * @param tokenList The list of token addresses to get the balance of
     * @return balances An array of balances, where the last element is the
     * balance of the native asset
     */
    function getTokenBalancesBatch(
        address owner,
        IERC20[] calldata tokenList
    ) public view returns (uint256[] memory balances) {
        uint256 n = tokenList.length;

        balances = new uint256[](n + 1);
        for (uint256 i = 0; i < n; ++i) {
            balances[i] = tokenList[i].balanceOf(owner);
        }

        balances[n] = owner.balance;
    }
}
