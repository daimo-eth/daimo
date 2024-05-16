// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

// Fully on-chain oracle that quotes an accurate USDC price for
// any (amount, token) using Uniswap V3 TWAP/TWALs. See
// https://uniswap.org/whitepaper-v3.pdf for more on TWAP/TWALs.
//
// Considers two paths: 1) directly from tokenIn to USDC, or 2) from tokenIn
// to a hopToken to USDC. hopTokens are other popular tokens that often appear
// in Uniswap routes -- for example, WETH.
//
// This ensures that if tokenIn is a token with an active Uniswap pool with
// either USDC or any of the hopTokens, the price is accurate.
contract DaimoUniswapOracle {
    uint256 constant _MAX_UINT128 = type(uint128).max;

    IERC20 public usdc;
    IERC20 public weth;
    IERC20[] public hopTokens;

    uint24[] public oracleFeeTiers;
    uint32 public oraclePeriod;
    IUniswapV3Factory public oraclePoolFactory;

    event OracleError(address pool, uint32 secondsAgo, string reason);
    event LowLevelOracleError(address pool, uint32 secondsAgo, bytes reason);

    constructor(
        IERC20 _usdc,
        IERC20 _weth,
        IERC20[] memory _hopTokens,
        uint24[] memory _oracleFeeTiers,
        uint32 _oraclePeriod,
        IUniswapV3Factory _oraclePoolFactory
    ) {
        usdc = _usdc;
        weth = _weth;
        hopTokens = _hopTokens;
        oracleFeeTiers = _oracleFeeTiers;
        oraclePeriod = _oraclePeriod;
        oraclePoolFactory = _oraclePoolFactory;
    }

    function consultOracle(
        address pool,
        uint32 secondsAgo
    )
        public
        view
        returns (int24 arithmeticMeanTick, uint128 harmonicMeanLiquidity)
    {
        (arithmeticMeanTick, harmonicMeanLiquidity) = OracleLibrary.consult({
            pool: pool,
            secondsAgo: secondsAgo
        });
    }

    // The best pool for a pair is the one with the highest liquidity over
    // different fee tiers.
    function getBestPoolTick(
        IERC20 tokenIn,
        IERC20 tokenOut
    ) public returns (address bestPool, int24 tick) {
        uint128 bestLiquidity = 0;
        for (uint256 i = 0; i < oracleFeeTiers.length; i++) {
            address pool = oraclePoolFactory.getPool({
                tokenA: address(tokenIn),
                tokenB: address(tokenOut),
                fee: oracleFeeTiers[i]
            });

            if (pool == address(0)) continue;

            // Consult TWAP/TWAL data, gracefully ignore reverts on observation being too old:
            // https://docs.uniswap.org/contracts/v3/reference/error-codes
            try this.consultOracle(pool, oraclePeriod) returns (
                int24 arithmeticMeanTick,
                uint128 harmonicMeanLiquidity
            ) {
                if (harmonicMeanLiquidity > bestLiquidity) {
                    bestLiquidity = harmonicMeanLiquidity;
                    bestPool = pool;
                    tick = arithmeticMeanTick;
                }
            } catch Error(string memory reason) {
                emit OracleError(pool, oraclePeriod, reason);
            } catch (bytes memory lowLevelData) {
                emit LowLevelOracleError(pool, oraclePeriod, lowLevelData);
            }
        }
    }

    // Direct pool quote: tokenIn -> USDC
    function quoteUSDCPool(
        uint128 amountIn,
        IERC20 tokenIn
    ) public returns (uint256 amountOut) {
        (address pool, int24 tick) = getBestPoolTick(tokenIn, usdc);

        if (pool == address(0)) return 0;

        amountOut = OracleLibrary.getQuoteAtTick({
            tick: tick,
            baseAmount: amountIn,
            baseToken: address(tokenIn),
            quoteToken: address(usdc)
        });
    }

    // 2 pool path: tokenIn -> [...hopTokens] -> USDC
    function quoteUSDCViaHop(
        uint128 amountIn,
        IERC20 tokenIn
    ) public returns (uint256 amountOut) {
        for (uint256 i = 0; i < hopTokens.length; i++) {
            IERC20 hopToken = hopTokens[i];

            if (hopToken == tokenIn) continue; // Covered by direct pool quote already

            (address pool, int24 tick) = getBestPoolTick(tokenIn, hopToken);

            if (pool == address(0)) continue;

            uint256 hopAmountOut = OracleLibrary.getQuoteAtTick({
                tick: tick,
                baseAmount: amountIn,
                baseToken: address(tokenIn),
                quoteToken: address(hopToken)
            });

            if (hopAmountOut > _MAX_UINT128) continue;

            uint256 pathAmountOut = quoteUSDCPool(
                uint128(hopAmountOut),
                hopToken
            );

            if (pathAmountOut > amountOut) amountOut = pathAmountOut;
        }
    }

    // Fetch an accurate USDC quote for a given (amount, token) pair.
    // token = 0x0 refers to ETH.
    function getUSDCQuote(
        uint128 amountIn,
        IERC20 tokenIn
    ) public returns (uint256 amountOut) {
        if (address(tokenIn) == address(0)) tokenIn = weth;
        if (tokenIn == usdc) return amountIn;

        uint256 directAmountOut = quoteUSDCPool(amountIn, tokenIn);
        uint256 hopAmountOut = quoteUSDCViaHop(amountIn, tokenIn);

        return directAmountOut > hopAmountOut ? directAmountOut : hopAmountOut;
    }
}
