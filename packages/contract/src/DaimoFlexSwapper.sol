// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/Ownable2StepUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

import "../vendor/chainlink/AggregatorV2V3Interface.sol";
import "./interfaces/IDaimoSwapper.sol";

/// @title Fully automatic on-chain swap executor
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Starts by quoting an accurate reference price from any input (token, amount)
/// to a list of supported output stablecoins using Uniswap V3 TWAP/TWALs. See
/// https://uniswap.org/whitepaper-v3.pdf for more on TWAP and TWAL.
///
/// Considers two paths: 1) directly from tokenIn to tokenOut, and 2) from
/// tokenIn to a hopToken to tokenOut. Hop tokens are other popular tokens, such
/// as WETH, that often appear in liquid Uniswap pools.
///
/// Market makers auto-swap Daimo assets on foreign chains to a bridgeable coin
/// (for accounts using DaimoCCTPBridger, this is USDC), and on home chains to
/// the account's home coin.
///
/// Supports all Uniswap-compatible input ERC20 tokens, including USDT (which is
/// not quite an ERC20) and not including ERC20s with amounts > 2^128.
///
/// Market makers can use this swapper by passing an arbitrary contract call.
/// DaimoFlexSwapper sends input tokens, calls the contract, then validates that
/// the output swap amount was received.
contract DaimoFlexSwapper is
    IDaimoSwapper,
    Ownable2StepUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    /// Describes how to perform the swap to achieve the quoted price or better.
    struct DaimoFlexSwapperExtraData {
        /// Swap contract to call.
        address callDest;
        /// Calldata to pass to the swap.
        bytes callData;
    }

    /// Describes how to price known tokens. Default = (no feed, not stablecoin,
    /// don't skip) = unknown tokens are priced via our UniswapV3 TWAP oracle.
    struct KnownToken {
        /// Chainlink reference price feed, or address(0) for no feed.
        AggregatorV2V3Interface chainlinkFeedAddr;
        /// If true, define reference price as $1.
        bool isStablecoin;
        /// If true, skip the Uniswap sanity check. Used for non-DEX tokens,
        /// including rebasing tokens like stETH.
        bool skipUniswap;
    }

    uint256 private constant _MAX_UINT128 = type(uint128).max;

    /// WETH / WMATIC / etc, the ERC-20 wrapped native token.
    IERC20 public wrappedNativeToken;
    /// Hop tokens. We search for two-pool routes going thru these tokens.
    IERC20[] public hopTokens;
    /// Supported output tokens, generally popular stablecoins.
    IERC20[] public outputTokens;
    mapping(IERC20 token => bool) public isOutputToken;
    /// Fee tiers. We search through these to find the one with highest TWAL.
    uint24[] public oracleFeeTiers;
    /// TWAP/TWAL period in seconds.
    uint32 public oraclePeriod;
    /// Uniswap pool factory, for looking up pools by (tokenA, tokenB, feeTier).
    IUniswapV3Factory public oraclePoolFactory;
    /// Pricing information for known tokens.
    mapping(IERC20 => KnownToken) public knownTokens;

    /// Emitted on each successful swap.
    event SwapToCoin(
        address indexed account,
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 estAmountOut,
        uint256 swapAmountOut
    );

    constructor() {
        _disableInitializers();
    }

    // ----- ADMIN FUNCTIONS -----

    /// We specify the initial owner (rather than using msg.sender) so that we
    /// can deploy the proxy via CREATE3 at a deterministic address.
    function init(
        address _initialOwner,
        IERC20 _wrappedNativeToken,
        IERC20[] calldata _hopTokens,
        IERC20[] calldata _outputTokens,
        uint24[] calldata _oracleFeeTiers,
        uint32 _oraclePeriod,
        IUniswapV3Factory _oraclePoolFactory,
        IERC20[] calldata _knownTokenAddrs,
        KnownToken[] calldata _knownTokens
    ) public initializer {
        __Ownable_init(_initialOwner);

        // All of the below are fixed at deployment time, editable via upgrade.
        wrappedNativeToken = _wrappedNativeToken;
        hopTokens = _hopTokens;
        outputTokens = _outputTokens;
        oracleFeeTiers = _oracleFeeTiers;
        oraclePeriod = _oraclePeriod;
        oraclePoolFactory = _oraclePoolFactory;

        for (uint256 i = 0; i < _outputTokens.length; ++i) {
            _addOutputToken(_outputTokens[i]);
        }
        for (uint256 i = 0; i < _knownTokenAddrs.length; ++i) {
            _setKnownToken(_knownTokenAddrs[i], _knownTokens[i]);
        }
    }

    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(address) internal view override onlyOwner {}

    /// UUPSUpgradeable: expose implementation
    function implementation() public view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /// Add a supported output token.
    function addOutputToken(IERC20 token) public onlyOwner {
        _addOutputToken(token);
    }

    function _addOutputToken(IERC20 token) private {
        require(address(token) != address(0), "DFS: missing token");
        require(isOutputToken[token] == false, "DFS: token already added");
        outputTokens.push(token);
        isOutputToken[token] = true;
    }

    /// Add or update Chainlink DataFeed aggregator for a token (against USD).
    function setKnownToken(
        IERC20 tokenAddr,
        KnownToken calldata token
    ) public onlyOwner {
        _setKnownToken(tokenAddr, token);
    }

    function _setKnownToken(
        IERC20 tokenAddr,
        KnownToken calldata token
    ) private {
        require(address(tokenAddr) != address(0), "DFS: missing token");
        knownTokens[tokenAddr] = token;
    }

    // ----- PUBLIC FUNCTIONS -----

    /// Swap input to output token at a fair price. Input token 0x0 refers to
    /// the native token, eg ETH. Output token cannot be 0x0.
    function swapToCoin(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) public payable returns (uint256 swapAmountOut) {
        // Input checks. Input token 0x0 = native token, output must be ERC-20.
        require(tokenIn != tokenOut, "DFS: input token = output token");
        require(address(tokenOut) != address(0), "DFS: output token = 0x0");
        require(isOutputToken[tokenOut], "DFS: unsupported output token");
        require(amountIn < _MAX_UINT128, "DFS: amountIn too large");
        DaimoFlexSwapperExtraData memory extra;
        extra = abi.decode(extraData, (DaimoFlexSwapperExtraData));

        // Get quote = best-effort price and path from tokenIn to tokenOut.
        (uint256 minAmountOut, uint256 swapEstAmountOut) = _getMinAmountOut({
            tokenIn: tokenIn,
            amountIn: amountIn,
            tokenOut: tokenOut
        });

        // Transfer native token or ERC-20 to the swap contract.
        address callDest = extra.callDest;
        bytes memory callData = extra.callData;
        uint256 callValue = 0;
        if (address(tokenIn) == address(0)) {
            require(msg.value == amountIn, "DFS: incorrect msg.value");
            callValue = amountIn;
        } else {
            require(msg.value == 0, "DFS: unexpected msg.value");
            tokenIn.safeTransferFrom(msg.sender, callDest, amountIn);
        }

        // Execute swap
        (bool success, ) = callDest.call{value: callValue}(callData);
        require(success, "DFS: swap failed");

        swapAmountOut = tokenOut.balanceOf(address(this));
        require(swapAmountOut > 0, "DFS: swap produced no output");
        require(swapAmountOut < _MAX_UINT128, "DFS: output too large");
        require(swapAmountOut >= minAmountOut, "DFS: insufficient output");

        // Finally, send the total output amount to msg.sender
        tokenOut.safeTransfer(msg.sender, swapAmountOut);

        emit SwapToCoin({
            account: msg.sender,
            tokenIn: address(tokenIn),
            amountIn: amountIn,
            tokenOut: address(tokenOut),
            estAmountOut: swapEstAmountOut,
            swapAmountOut: swapAmountOut
        });
    }

    /// Gets the minimum output amount for a given input amount.
    /// DaimoFlexSwapper is responsible for ensuring a fair minimum price even
    /// when called via an adversarial party. We use Uniswap TWAP/TWAL, with a
    /// Chainlink sanity check where available. For both input  and output,
    /// token = 0x0 refers to ETH or the native asset (eg MATIC on Polygon).
    function _getMinAmountOut(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut
    ) private view returns (uint256 minAmountOut, uint256 swapEstAmountOut) {
        require(amountIn > 0, "DFS: amountIn = 0");
        if (address(tokenIn) == address(0)) tokenIn = wrappedNativeToken;
        if (address(tokenOut) == address(0)) tokenOut = wrappedNativeToken;

        if (tokenIn == tokenOut) {
            // Native token to wrapped native token, eg ETH > WETH: require 1:1
            return (amountIn, amountIn);
        }

        // We have a pair, TokenIn != TokenOut. Determine how to price it.
        KnownToken memory knownIn = knownTokens[tokenIn];
        KnownToken memory knownOut = knownTokens[tokenOut];

        // Ref-Price tokens: known stables ($1), Chainlink price feed tokens.
        // Skip-Uni tokens: rebasing tokens, etc with no Uniswap liquidity.
        //
        // | Category of token pair          | Min Output | Sanity Check |
        // | ------------------------------- | ---------- | ------------ |
        // | Both stablecoins                | 1:1        | UniDiff ≤ 4% |
        // | eg (USDC, DAI)                  |            |              |
        // | Both Ref-Price, no Skip-Uni     | Ref - 1%   | UniDiff ≤ 4% |
        // | eg (USDC, OP)                   |            |              |
        // | No Ref-Price, no Skip-Uni       | Uni - 2%   | None         |
        // | eg (USDC, HIGHER)               |            |              |
        // | Both Ref-Price, Skip-Uni        | Ref - 1%   | None         |
        // | eg (USDC, stETH)                |            |              |
        // | No Ref-Price, Skip-Uni          | N/A        | N/A          |
        // | eg (stETH, HIGHER)              |            |              |
        //

        bool stableToStable = knownIn.isStablecoin && knownOut.isStablecoin;
        bool hasUniswap = !knownIn.skipUniswap && !knownOut.skipUniswap;

        // Quote Uniswap, if applicable
        if (hasUniswap) {
            uint128 amountIn128 = uint128(amountIn);
            (swapEstAmountOut, ) = quote(tokenIn, amountIn128, tokenOut);
            require(swapEstAmountOut > 0, "DFS: no path found, amountOut 0");
        }

        // Determine minimum output amount.
        uint256 refAmountOut = 0;
        if (stableToStable) {
            // Require USD stablecoins to be exchanged 1-to-1.
            refAmountOut = amountIn;
            minAmountOut = amountIn;
        } else {
            // Get Chainlink quote, if available (if not, refAmountOut = 0).
            refAmountOut = getChainlinkQuote(tokenIn, amountIn, tokenOut);
            if (refAmountOut > 0) {
                // Minimum output: Ref - 1%
                minAmountOut = refAmountOut - (refAmountOut / 100);
            } else {
                // For DaimoAccountV2, this condition is unreachable as long as
                // we ensure that 1. all Skip-Uni tokens like stETH are priced
                // (= stable or feed), and 2. all allowed home coins are priced.
                require(hasUniswap, "DFS: cannot price pair");
                // Minimum output: Uni - 2%
                minAmountOut = swapEstAmountOut - (swapEstAmountOut / 50);
            }
        }

        // Sanity check: liquidity must exist within 4% of reference price.
        if (refAmountOut > 0 && hasUniswap) {
            int256 diff = int256(swapEstAmountOut) - int256(refAmountOut);
            uint256 absDiff = uint256(diff < 0 ? -diff : diff);
            require(
                absDiff < swapEstAmountOut / 25,
                "DFS: quote sanity check failed"
            );
        }

        // In all cases, we set a minimum output amount.
        assert(minAmountOut > 0);
    }

    // ----- QUOTER FUNCTIONS -----

    /// Fetch a best-effort quote for a given token pair + exact input amount.
    /// Uses Uniswap TWAP/TWAL.
    function quote(
        IERC20 tokenIn,
        uint128 amountIn,
        IERC20 tokenOut
    ) public view returns (uint256 amountOut, bytes memory swapPath) {
        // Same token = no swap.
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
    /// Uses the pool with best TWAL = time-weighted average liquidity.
    function quoteDirect(
        IERC20 tokenIn,
        uint128 amountIn,
        IERC20 tokenOut
    ) public view returns (uint128 amountOut, uint24 fee) {
        (, , fee, amountOut) = getBestPoolTick(tokenIn, amountIn, tokenOut);
    }

    /// 2-hop paths: [tokenIn -> hopToken -> tokenOut]
    /// Uses quoteDirect() for each leg, then chooses the highest TWAP path.
    function quoteViaHop(
        IERC20 tokenIn,
        uint128 amountIn,
        IERC20 tokenOut
    ) public view returns (uint256 amountOut, bytes memory swapPath) {
        uint256 hopTokensLength = hopTokens.length;
        for (uint256 i = 0; i < hopTokensLength; ++i) {
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
        uint256 oracleFeeTiersLength = oracleFeeTiers.length;
        for (uint256 i = 0; i < oracleFeeTiersLength; ++i) {
            address pool = oraclePoolFactory.getPool({
                tokenA: address(tokenA),
                tokenB: address(tokenB),
                fee: oracleFeeTiers[i]
            });

            if (pool == address(0)) continue;

            // Consult TWAP/TWAL data. Gracefully ignore old-observation reverts
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

                // required = approximate x * y of trade
                // available = approximate x * y = mean(sqrt(xy))^2
                uint256 requiredXY = uint256(amountIn) * estAmountOut256;
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
                // Ignore errors. This is a view function, so no logs either.
                // Can trace to debug oracle issues if needed.
            }
        }
        // No pools with enough liquidity.
        if (bestLiquidity == 0) return (address(0), 0, 0, 0);
    }

    /// Fetches TWAP/TWAL for a single Uniswap pool.
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

    /// Estimates a fair price based on the Chainlink oracle. Both tokenIn and
    /// tokenOut must be ERC-20 tokens. Stablecoins (see isStablecoin) are
    /// priced at $1. This function reverts if the feed returns a stale result,
    /// or if there is an arithmetic overflow due to an extreme price output.
    /// @return refAmountOut Reference fair-value output amount, or 0 if the
    ///                      given token pair cannot be priced.
    function getChainlinkQuote(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut
    ) public view returns (uint256 refAmountOut) {
        uint8 decIn = IERC20Metadata(address(tokenIn)).decimals();
        uint8 decOut = IERC20Metadata(address(tokenOut)).decimals();

        (uint256 priceIn, uint8 decPriceIn) = this.getChainlinkPrice(tokenIn);
        (uint256 priceOut, uint8 decPriceOut) = this.getChainlinkPrice(
            tokenOut
        );
        if (priceIn == 0 || priceOut == 0) {
            return 0;
        }

        // Example:
        // amountIn: 2.0 OP = (2e18, 18 decimals)
        // priceIn: 1.4628 USD/OP = (146280, 5 decimals)
        // priceOut: 3210.0 USD/ETH = (32100, 1 decimal)
        // amountOut = amountIn * priceIn / priceOut = 0.0009114 ETH
        //
        // Corresponding integer calculation:
        // aO = (aI * aPI * 10^dO * 10^dPO) / (aPO * 10^dI * 10^dPI)
        //    = aI * aPI * 10^(d0 + dPO - dI - dPI) / aPO
        //
        //    = 2e18 * 146280 * 10^(18 + 1 - 18 - 5) / 32100
        //    = 2e18 * 146280 / 10^4 / 32100
        //    = 911401869158878
        //    = 0.0009114 eth
        int256 exp = int8(decOut) +
            int8(decPriceOut) -
            int8(decIn) -
            int8(decPriceIn);
        uint256 absExp = uint256(exp < 0 ? -exp : exp);
        uint256 ret = amountIn * priceIn;
        ret = exp < 0 ? ret / (10 ** absExp) : ret * (10 ** absExp);
        ret = ret / priceOut;
        return ret;
    }

    /// Fetches a reference price for an asset, in USD. Stablecoins are priced
    /// at $1.00, other ERC-20 tokens are priced using Chainlink.
    /// @return price a price, or 0 if the token has no price feed configured.
    /// @return decimals decimals for the price, eg (5, 3) = 0.005
    function getChainlinkPrice(
        IERC20 token
    ) public view returns (uint256 price, uint8 decimals) {
        KnownToken memory knownToken = knownTokens[token];
        if (knownToken.isStablecoin) return (1, 0);

        AggregatorV2V3Interface feed = knownToken.chainlinkFeedAddr;
        if (address(feed) == address(0)) return (0, 0);

        // Get the latest round data from the feed.
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.latestRoundData();

        // Check that the quote is valid and not stale.
        require(answer > 0, "DFS: CL price <= 0");
        // Chainlink feeds are updated at varying max intervals + whenever the
        // price delta exceeds some threshold. For many tokens, the max interval
        // is 24 hours.
        uint256 maxFeedRoundAge = 24 hours;
        require(updatedAt >= block.timestamp - maxFeedRoundAge, "DFS: CL old");
        require(answeredInRound >= roundId, "DFS: CL wrong round");
        require(answer < int256(_MAX_UINT128), "DFS: CL price too large");

        price = uint256(answer);
        decimals = feed.decimals();
    }

    /// Exists to expose DaimoFlexSwapperExtraData in generated ABI.
    function extraDataStruct(DaimoFlexSwapperExtraData memory sig) public {}
}
