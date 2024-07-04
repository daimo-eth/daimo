// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/Path.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";

import "./IDaimoSwapper.sol";

/// Fully automatic on-chain swap executor.
///
/// Starts by quoting an accurate reference price from any input (token, amount)
/// to a list of supported output stablecoins using Uniswap V3 TWAP/TWALs. See
/// https://uniswap.org/whitepaper-v3.pdf for more on TWAP and TWAL.
///
/// Considers two paths: 1) directly from tokenIn to tokenOut, and 2) from
/// tokenIn to a hopToken to tokenOut. Hop tokens are other popular tokens, such
/// as WETH, that often appear in liquid Uniswap pools.
///
/// This ensures that if tokenIn is a token with an active Uniswap pool with
/// either the output stablecoin or any of the hopTokens, the price is accurate.
///
/// Market makers auto-swap Daimo assets on foreign chains to a bridgeable coin
/// (for accounts using DaimoCCTPBridger, this is USDC), and on home chains to
/// the account's home coin.
///
/// Market makers can use this swapper in one of two ways:
/// 1. Passing an arbitrary contract call. In this case, DaimoFlexSwapper
///    approves the contract for (tokenIn, amountIn), calls it, and validates
///    that the (tokenOut) balance increased by the expected amount.
/// 2. Passing the zero address + no calldata. In this case, DaimoFlexSwapper
///    uses the Uniswap route found when quoting the reference price.
contract DaimoFlexSwapper is IDaimoSwapper, Ownable2Step {
    /// Describes how to perform the swap to achieve the quoted price or better.
    struct DaimoFlexSwapperExtraData {
        /// Swap contract to call, or address(0) to use the quoted Uniswap path.
        address callDest;
        /// Calldata to pass to the swap. Must be empty if callDest is zero.
        bytes callData;
        /// Optional tip to bring output amount up to at least that much, or 0.
        /// Payer must first approve() some amount of the output token. If the
        /// approved amount is lower than the amount needed to bring the swap
        /// output up to tipToExactAmountOut, then the swap will fail.
        ///
        /// This can be used to execute swaps at a precise, predefined rate.
        /// DaimoFlexSwapper always enforces that the final output amount
        /// (including any tip) meets the quote minimum.
        uint128 tipToExactAmountOut;
        /// Tip payer (or, in the case of a swap that produces more output than
        /// tipToExactAmountOut, tip recipient).
        address tipPayer;
    }

    uint256 private constant _MAX_UINT128 = type(uint128).max;

    /// Uniswap router for executing swaps.
    ISwapRouter public uniswapRouter;
    /// Weth, used for handling input or output native ETH.
    IERC20 public weth;
    /// Hop tokens. We search for two-pool routes going thru these tokens.
    IERC20[] public hopTokens;
    /// Supported output tokens, generally popular stablecoins.
    IERC20[] public outputTokens;
    /// See outputTokens
    mapping(IERC20 => bool) public isOutputToken;
    /// Fee tiers. We search through these to find the one with highest TWAL.
    uint24[] public oracleFeeTiers;
    /// TWAP/TWAL period in seconds.
    uint32 public oraclePeriod;
    /// Uniswap pool factory, for looking up pools by (tokenA, tokenB, feeTier).
    IUniswapV3Factory public oraclePoolFactory;

    /// Emitted on each successful swap.
    event SwapToCoin(
        address account,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 estAmountOut,
        uint256 swapAmountOut,
        uint256 totalAmountOut
    );

    constructor(
        IERC20 _weth,
        IERC20[] memory _hopTokens,
        IERC20[] memory _outputTokens,
        ISwapRouter _uniswapRouter,
        uint24[] memory _oracleFeeTiers,
        uint32 _oraclePeriod,
        IUniswapV3Factory _oraclePoolFactory
    ) {
        weth = _weth;
        hopTokens = _hopTokens;
        outputTokens = _outputTokens;
        uniswapRouter = _uniswapRouter;
        oracleFeeTiers = _oracleFeeTiers;
        oraclePeriod = _oraclePeriod;
        oraclePoolFactory = _oraclePoolFactory;

        for (uint256 i = 0; i < _outputTokens.length; i++) {
            isOutputToken[_outputTokens[i]] = true;
        }
    }

    /// Swap input to output token at a fair price, given a path and possibly a
    /// tip amount to prevent high slippage from blocking any swap.
    function swapToCoin(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) public returns (uint256 totalAmountOut) {
        // Input checks
        require(isOutputToken[tokenOut], "DFS: unsupported output token");
        require(amountIn < _MAX_UINT128, "DFS: amountIn too large");
        DaimoFlexSwapperExtraData memory extra = _decodeExtraData(extraData);

        // Get quote = best-effort price and path from tokenIn to tokenOut.
        uint128 amountIn128 = uint128(amountIn);
        (uint256 swapEstAmountOut, bytes memory swapPath) = quote(
            tokenIn,
            amountIn128,
            tokenOut
        );
        require(swapEstAmountOut > 0, "DFS: no path found, amountOut 0");

        // 1% slippage tolerance = should be plenty for the stablecoin-to-
        // stablecoin common case. Edge cases handled via tipToExactAmount.
        uint256 minAmountOut = swapEstAmountOut - (swapEstAmountOut / 100);

        // Next, prepare the swap.
        address callDest;
        bytes memory callData;
        if (extra.callDest != address(0)) {
            // Option 1: pass an arbitrary contract call
            callDest = extra.callDest;
            callData = extra.callData;
        } else {
            // Option 2: call Uniswaap, use the reference quote path
            callDest = address(uniswapRouter);
            callData = _getUniswapCalldata(swapPath, amountIn);
        }

        // Claim input token from caller, then approve it to the swap contract.
        TransferHelper.safeTransferFrom(
            address(tokenIn),
            msg.sender,
            address(this),
            amountIn
        );
        TransferHelper.safeApprove(address(tokenIn), callDest, amountIn);

        // Execute swap
        (bool success, ) = callDest.call(callData);
        require(success, "DFS: swap failed");

        uint256 swapAmountOut = tokenOut.balanceOf(address(this));
        require(swapAmountOut > 0, "DFS: swap produced no output");
        require(swapAmountOut < _MAX_UINT128, "DFS: excessive swap output");

        // Receive tip or pay tip, if any
        if (extra.tipToExactAmountOut > 0) {
            totalAmountOut = extra.tipToExactAmountOut;
            require(totalAmountOut >= minAmountOut, "DFS: insufficient tip");

            // Tip the difference
            // Guaranteed not to overflow, both sides verified to fit in uint128
            int256 shortfall = int256(totalAmountOut) - int256(swapAmountOut);
            if (shortfall > 0) {
                // Tip payer approves() some maximum tip beforehand. If
                // insufficient, the swap fails.
                TransferHelper.safeTransferFrom(
                    address(tokenOut),
                    extra.tipPayer,
                    address(this),
                    uint256(shortfall)
                );
            } else if (shortfall < 0) {
                TransferHelper.safeTransferFrom(
                    address(tokenOut),
                    address(this),
                    extra.tipPayer,
                    uint256(-shortfall)
                );
            }
        } else {
            // No tip. Ensure that the amount received from the swap is enough.
            totalAmountOut = swapAmountOut;
            require(totalAmountOut >= minAmountOut, "DFS: insufficient output");
        }
        assert(totalAmountOut > 0); // Since minAmountOut guaranteed > 0

        // Finally, send the total output amount to msg.sender
        TransferHelper.safeTransfer(
            address(tokenOut),
            msg.sender,
            totalAmountOut
        );

        emit SwapToCoin(
            msg.sender,
            address(tokenIn),
            amountIn,
            address(tokenOut),
            swapEstAmountOut,
            swapAmountOut,
            totalAmountOut
        );
    }

    /// Fetch a best-effort quote for a given token pair + exact input amount.
    /// For both input and output, token = 0x0 refers to ETH > will use WETH.
    function quote(
        IERC20 tokenIn,
        uint128 amountIn,
        IERC20 tokenOut
    ) public view returns (uint256 amountOut, bytes memory swapPath) {
        if (address(tokenIn) == address(0)) tokenIn = weth;
        if (address(tokenOut) == address(0)) tokenOut = weth;

        // Same token swap.
        if (tokenIn == tokenOut) {
            amountOut = amountIn;
            swapPath = new bytes(0);
            return (amountOut, swapPath);
        }
        (uint256 directAmountOut, uint24 directFee) = quoteDirect(
            tokenIn,
            amountIn,
            tokenOut
        );

        (uint256 hopAmountOut, bytes memory swapPathHop) = quoteViaHop(
            tokenIn,
            amountIn,
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

    /// Direct 1-hop quote: [tokenIn -> tokenOut]
    function quoteDirect(
        IERC20 tokenIn,
        uint128 amountIn,
        IERC20 tokenOut
    ) public view returns (uint128 amountOut, uint24 fee) {
        int24 tick;
        address swapPool;
        (swapPool, tick, fee, amountOut) = getBestPoolTick(
            tokenIn,
            amountIn,
            tokenOut
        );
    }

    /// 2-hop paths: [tokenIn -> hopToken -> tokenOut]
    function quoteViaHop(
        IERC20 tokenIn,
        uint128 amountIn,
        IERC20 tokenOut
    ) public view returns (uint256 amountOut, bytes memory swapPath) {
        for (uint256 i = 0; i < hopTokens.length; i++) {
            IERC20 hopToken = hopTokens[i];

            if (hopToken == tokenIn) continue; // Covered by direct quote
            if (hopToken == tokenOut) continue; // Covered by direct quote

            (uint128 amountHopToken, uint24 fee1) = quoteDirect(
                tokenIn,
                amountIn,
                hopToken
            );

            if (amountHopToken == 0) continue;

            (uint256 amountTokenOut, uint24 fee2) = quoteDirect(
                hopToken,
                amountHopToken,
                tokenOut
            );

            if (amountTokenOut <= amountOut) continue;

            amountOut = amountTokenOut;
            swapPath = abi.encodePacked(
                address(tokenIn),
                fee1,
                address(hopToken),
                fee2,
                address(tokenOut)
            );
        }
    }

    /// The best pool for a pair is the one with the highest liquidity over
    /// different fee tiers and minimum required liquidity to perform the swap.
    function getBestPoolTick(
        IERC20 tokenA,
        uint128 amountIn,
        IERC20 tokenB
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
                    harmonicMeanLiquidity > bestLiquidity &&
                    availableXY >= requiredXY
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

    /// Gets TWAP/TWAL for a single Uniswap pool.
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

    /// Exists to expose DaimoFlexSwapperExtraData in generated ABI.
    function extraDataStruct(DaimoFlexSwapperExtraData memory sig) public {}

    function _decodeExtraData(
        bytes calldata extraData
    ) private pure returns (DaimoFlexSwapperExtraData memory) {
        // Allow passing empty extra data
        if (extraData.length == 0) {
            return DaimoFlexSwapperExtraData(address(0), "", 0, address(0));
        }
        return abi.decode(extraData, (DaimoFlexSwapperExtraData));
    }

    function _getUniswapCalldata(
        bytes memory swapPath,
        uint256 amountIn
    ) private view returns (bytes memory callData) {
        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: swapPath,
                recipient: msg.sender, // Routed directly to caller
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0 // Output validated in swapToCoin
            });

        callData = abi.encodeWithSelector(
            bytes4(
                keccak256("exactInput((bytes,address,uint256,uint256,uint256))")
            ),
            params
        );
    }
}
