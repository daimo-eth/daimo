// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/Path.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "./IDaimoSwapper.sol";

// Fully on-chain swap executor that quotes stablecoin swaps using Uniswap V3
// TWAP/TWALs. Seehttps://uniswap.org/whitepaper-v3.pdf for more on TWAP/TWALs.
//
// Considers two paths for inbound/outbound swaps.
// 1) directly from tokenIn to tokenOut, or 2) from tokenIn to a hopToken to
// tokenOut. hopTokens are other popular tokens that often appear in Uniswap
// routes -- for example, WETH.
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

  // Gets TWAP and TWAL for a single pool.
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
  // different fee tiers and minimum required liquidity to perform the swap.
  function getBestPoolTick(
    IERC20 tokenA,
    IERC20 tokenB,
    uint128 amountIn
  )
    public
    view
    returns (
      address bestPool,
      int24 tick,
      uint24 bestFee,
      uint128 bestAmountOut
    )
  {
    uint128 bestLiquidity = 0;
    for (uint256 i = 0; i < oracleFeeTiers.length; i++) {
      address pool = oraclePoolFactory.getPool({
        tokenA: address(tokenA),
        tokenB: address(tokenB),
        fee: oracleFeeTiers[i]
      });

      if (pool == address(0)) continue;

      // Consult TWAP/TWAL data, gracefully ignore reverts on observation being too old:
      // https://docs.uniswap.org/contracts/v3/reference/error-codes
      try this.consultOracle(pool, oraclePeriod) returns (
        int24 arithmeticMeanTick,
        uint128 harmonicMeanLiquidity
      ) {
        // Check that the pool has enough liquidity.
        uint256 estAmountOut256 = OracleLibrary.getQuoteAtTick({
          tick: arithmeticMeanTick,
          baseAmount: amountIn,
          baseToken: address(tokenA),
          quoteToken: address(tokenB)
        });

        if (estAmountOut256 > _MAX_UINT128) continue; // swap too large

        uint256 requiredXY = uint256(amountIn) * estAmountOut256; // x * y of trade
        uint256 availableXY = uint256(harmonicMeanLiquidity) *
          uint256(harmonicMeanLiquidity);

        if (
          harmonicMeanLiquidity > bestLiquidity && availableXY >= requiredXY
        ) {
          bestLiquidity = harmonicMeanLiquidity;
          bestPool = pool;
          tick = arithmeticMeanTick;
          bestFee = oracleFeeTiers[i];
          bestAmountOut = uint128(estAmountOut256);
        }
      } catch {
        // Ignore errors. No event emits, to keep this a view function.
        // Can trace to debug oracle issues if needed.
      }
    }
    // No pools with enough liquidity.
    if (bestLiquidity == 0) return (address(0), 0, 0, 0);
  }

  // Direct 1-hop quote: [tokenIn -> tokenOut]
  function quoteDirect(
    uint128 amountIn,
    IERC20 tokenIn,
    IERC20 tokenOut
  ) public view returns (uint256 amountOut, uint24 fee) {
    int24 tick;
    address swapPool;
    (swapPool, tick, fee, amountOut) = getBestPoolTick(
      tokenIn,
      tokenOut,
      amountIn
    );
  }

  // 2-hop paths: [tokenIn -> hopToken -> tokenOut]
  function quoteViaHop(
    uint128 amountIn,
    IERC20 tokenIn,
    IERC20 tokenOut
  ) public view returns (uint256 amountOut, bytes memory swapPath) {
    for (uint256 i = 0; i < hopTokens.length; i++) {
      IERC20 hopToken = hopTokens[i];

      if (hopToken == tokenIn) continue; // Covered by direct quote
      if (hopToken == tokenOut) continue; // Covered by direct quote

      (
        address poolOne,
        ,
        uint24 feeOne,
        uint128 hopAmountOut
      ) = getBestPoolTick(tokenIn, hopToken, amountIn);

      if (poolOne == address(0)) continue;

      (uint256 pathAmountOut, uint24 feeTwo) = quoteDirect(
        hopAmountOut,
        hopToken,
        tokenOut
      );

      if (pathAmountOut > amountOut) {
        amountOut = pathAmountOut;
        swapPath = abi.encodePacked(
          address(tokenIn),
          feeOne,
          address(hopToken),
          feeTwo,
          address(tokenOut)
        );
      }
    }
  }

  // Fetch a best-effort quote for a given exact input token pair.
  // token = 0x0 refers to ETH.
  function quote(
    uint128 amountIn,
    IERC20 tokenIn,
    IERC20 tokenOut
  ) public view returns (uint256 amountOut, bytes memory swapPath) {
    if (address(tokenIn) == address(0)) tokenIn = weth;
    if (address(tokenOut) == address(0)) tokenOut = weth;

    // Same token swap.
    if (tokenIn == tokenOut) {
      return (amountIn, new bytes(0));
    }

    (uint256 directAmountOut, uint24 directFee) = quoteDirect(
      amountIn,
      tokenIn,
      tokenOut
    );

    (uint256 hopAmountOut, bytes memory swapPathHop) = quoteViaHop(
      amountIn,
      tokenIn,
      tokenOut
    );

    if (directAmountOut > hopAmountOut) {
      amountOut = directAmountOut;
      swapPath = abi.encodePacked(
        address(tokenIn),
        directFee,
        address(tokenOut)
      );
    } else {
      amountOut = hopAmountOut;
      swapPath = swapPathHop;
    }
  }

  function getFinalOutputToken(
    bytes memory swapPath
  ) public pure returns (IERC20) {
    require(swapPath.length > 20, "invalid swap path");
    bytes memory outputToken = new bytes(20);
    for (uint256 i = 0; i < 20; i++) {
      outputToken[i] = swapPath[swapPath.length - 20 + i];
    }

    return IERC20(address(bytes20(outputToken)));
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

    // // Compute a fair price for the input token swap.
    (uint256 oracleAmountOut, ) = quote(amountIn, tokenIn, usdc);

    // 1% slippage tolerance, to incentivize quick swaps via MEV.
    uint256 expectedAmountOut = oracleAmountOut - (oracleAmountOut / 100);
    uint256 swapAmountOutMinimum = expectedAmountOut - altruisticAmountOut;

    ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
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
