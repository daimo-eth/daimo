// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./IDaimoSwapper.sol";

// Fully on-chain swap executor that quotes an accurate USDC price for
// any (amount, token) using Uniswap V3 TWAP/TWALs. See
// https://uniswap.org/whitepaper-v3.pdf for more on TWAP/TWALs.
//
// Considers two paths: 1) directly from tokenIn to USDC, or 2) from tokenIn
// to a hopToken to USDC. hopTokens are other popular tokens that often appear
// in Uniswap routes -- for example, WETH.
//
// This ensures that if tokenIn is a token with an active Uniswap pool with
// either USDC or any of the hopTokens, the price is accurate.
contract DaimoUSDCSwapper is IDaimoSwapper {
    struct DaimoUSDCSwapperExtraData {
        bytes swapPath;
        uint128 altruisticAmountOut;
        address altruisticSender;
    }

    // no-op function with struct as argument to expose it in generated ABI
    function extraDataStruct(DaimoUSDCSwapperExtraData memory sig) public {}

    uint256 constant _MAX_UINT128 = type(uint128).max;

    // Constants used by Uniswap.
    ISwapRouter public uniswapRouter;
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
        ISwapRouter _uniswapRouter,
        uint24[] memory _oracleFeeTiers,
        uint32 _oraclePeriod,
        IUniswapV3Factory _oraclePoolFactory
    ) {
        usdc = _usdc;
        weth = _weth;
        hopTokens = _hopTokens;
        uniswapRouter = _uniswapRouter;
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

    function getFinalOutputToken(
        bytes memory swapPath
    ) public pure returns (IERC20) {
        require(swapPath.length > 20, "invalid swap path");
        bytes memory outputToken = new bytes(20);
        for (uint256 i = 0; i < 20; i++) {
            outputToken[i] = swapPath[swapPath.length - 20 + i];
        }

        return IERC20(address(uint160(bytes20(outputToken))));
    }

    // Swap input coins to USDC at a fair price, given a path and possibly
    // an altruistic amount to prevent high slippage from blocking any swap.
    function swapToBridgableCoin(
        uint128 amountIn,
        IERC20 tokenIn,
        bytes calldata extraData
    ) public returns (uint128 totalAmountOut, IERC20 tokenOut) {
        DaimoUSDCSwapperExtraData memory extra = abi.decode(
            extraData,
            (DaimoUSDCSwapperExtraData)
        );
        bytes memory swapPath = extra.swapPath;
        uint128 altruisticAmountOut = extra.altruisticAmountOut;
        address altruisticSender = extra.altruisticSender;

        // Move input token from caller to this contract and approve
        // uniswap router to spend it.
        TransferHelper.safeTransferFrom(
            address(tokenIn),
            msg.sender,
            address(this),
            amountIn
        );
        TransferHelper.safeApprove(
            address(tokenIn),
            address(uniswapRouter),
            amountIn
        );

        // Compute a fair price for the input token swap.
        uint256 oracleAmountOut = getUSDCQuote(amountIn, tokenIn);
        // 1% slippage tolerance, to incentivize quick swaps via MEV.
        uint256 expectedAmountOut = oracleAmountOut - (oracleAmountOut / 100);
        uint256 swapAmountOutMinimum = expectedAmountOut - altruisticAmountOut;

        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: swapPath,
                recipient: msg.sender, // Routed directly to caller
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: swapAmountOutMinimum
            });

        uint256 swapAmountOut256 = uniswapRouter.exactInput(params);
        require(swapAmountOut256 < _MAX_UINT128, "swap too large");
        uint128 swapAmountOut = uint128(swapAmountOut256);
        IERC20 outputToken = getFinalOutputToken(swapPath);
        require(outputToken == usdc, "not USDC");

        require(
            swapAmountOut + altruisticAmountOut >= expectedAmountOut,
            "not enough output"
        );

        // Route altruistic funds to the caller.
        if (altruisticAmountOut > 0) {
            TransferHelper.safeTransferFrom(
                address(usdc),
                altruisticSender,
                msg.sender,
                altruisticAmountOut
            );
        }

        totalAmountOut = swapAmountOut + altruisticAmountOut;
        tokenOut = usdc;
    }
}
