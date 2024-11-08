// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

import "../DaimoFlexSwapper.sol";

contract DaimoPayBatchReadUtils is Ownable {
    IERC20[] public tokens;
    IERC20 public quoteToken;
    uint128 public quoteAmount;
    DaimoFlexSwapper public dfs;

    constructor(
        address initialOwner,
        IERC20 _quoteToken,
        uint128 _quoteAmount,
        address _dfs
    ) Ownable(initialOwner) {
        quoteToken = _quoteToken;
        quoteAmount = _quoteAmount;
        dfs = DaimoFlexSwapper(_dfs);
    }

    function getAllTokens() public view returns (IERC20[] memory) {
        return tokens;
    }

    function setTokens(IERC20[] memory _tokens) public onlyOwner {
        tokens = _tokens;
    }

    function setQuoterValues(
        IERC20 _quoteToken,
        uint128 _quoteAmount,
        DaimoFlexSwapper _dfs
    ) public onlyOwner {
        quoteToken = _quoteToken;
        quoteAmount = _quoteAmount;
        dfs = _dfs;
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

    /**
     * @notice Get the quotes for all saved tokens using the DaimoFlexSwapper.
     * @return amountOut The amount of tokens output for swapping quoteAmount of
     * quoteToken.
     */
    function getQuotes() public view returns (uint256[] memory amountOut) {
        uint256 n = tokens.length;

        amountOut = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) {
            (amountOut[i], ) = dfs.quote({
                tokenIn: quoteToken,
                amountIn: quoteAmount,
                tokenOut: tokens[i]
            });
        }
    }

    /**
     * @notice Get the quotes for a custom list of tokens using the DaimoFlexSwapper.
     * @return amountOut The amount of tokens output for swapping quoteAmount of
     * quoteToken.
     */
    function getQuotesBatch(
        IERC20[] calldata tokenList,
        IERC20 _quoteToken,
        uint128 _quoteAmount,
        DaimoFlexSwapper _dfs
    ) public view returns (uint256[] memory amountOut) {
        uint256 n = tokenList.length;

        amountOut = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) {
            (amountOut[i], ) = _dfs.quote({
                tokenIn: _quoteToken,
                amountIn: _quoteAmount,
                tokenOut: tokenList[i]
            });
        }
    }

    /**
     * @notice Get the balances and quotes for all saved tokens.
     * @return balances The balances of the tokens
     * @return amountOut The amount of tokens output for swapping quoteAmount of
     * quoteToken.
     */
    function getBalancesAndQuotes(
        address owner
    )
        public
        view
        returns (uint256[] memory balances, uint256[] memory amountOut)
    {
        balances = getTokenBalances(owner);
        amountOut = getQuotes();
    }
}
