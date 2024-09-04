// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "@uniswap/v3-periphery/contracts/libraries/Path.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/DaimoFlexSwapper.sol";

// Test onchain route-finder and quoter.
contract QuoterTest is Test {
    IERC20 public usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 public weth = IERC20(0x4200000000000000000000000000000000000006);
    IERC20 public degen = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed);

    FakeAggregator public fakeFeedETHUSD = new FakeAggregator();
    FakeAggregator public fakeFeedDEGENUSD = new FakeAggregator();

    DaimoFlexSwapper public swapper;
    uint256 private constant _DIRECT_ROUTE_SWAP_LENGTH = 43;

    DaimoFlexSwapper.KnownToken private zeroToken =
        DaimoFlexSwapper.KnownToken({
            chainlinkFeedAddr: AggregatorV2V3Interface(address(0)),
            isStablecoin: false,
            skipUniswap: false
        });

    function setUp() public {
        assert(block.chainid == 8453);
        assert(block.number == 15950101); // Block specific test

        // Hop token
        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        // Output token
        IERC20[] memory outputTokens = new IERC20[](1);
        outputTokens[0] = usdc;

        // Add stablecoins
        IERC20[] memory knownTokenAddrs = new IERC20[](3);
        DaimoFlexSwapper.KnownToken[]
            memory knownTokens = new DaimoFlexSwapper.KnownToken[](3);
        knownTokenAddrs[0] = usdc;
        knownTokens[0] = DaimoFlexSwapper.KnownToken({
            chainlinkFeedAddr: AggregatorV2V3Interface(address(0)),
            isStablecoin: true,
            skipUniswap: false
        });

        // ... then, add Chainlink priced tokens
        knownTokenAddrs[1] = weth;
        knownTokens[1] = DaimoFlexSwapper.KnownToken({
            chainlinkFeedAddr: fakeFeedETHUSD,
            isStablecoin: false,
            skipUniswap: false
        });
        knownTokenAddrs[2] = degen;
        knownTokens[2] = DaimoFlexSwapper.KnownToken({
            chainlinkFeedAddr: fakeFeedDEGENUSD,
            isStablecoin: false,
            skipUniswap: false
        });

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        address swapperImpl = address(new DaimoFlexSwapper());
        swapper = DaimoFlexSwapper(address(new ERC1967Proxy(swapperImpl, "")));

        swapper.init({
            _initialOwner: address(this),
            _wrappedNativeToken: weth,
            _hopTokens: hopTokens,
            _outputTokens: outputTokens,
            _oracleFeeTiers: oracleFeeTiers,
            _oraclePeriod: 1 minutes,
            _oraclePoolFactory: IUniswapV3Factory(
                0x33128a8fC17869897dcE68Ed026d694621f6FDfD
            ),
            _knownTokenAddrs: knownTokenAddrs,
            _knownTokens: knownTokens
        });
    }

    function testChainlinkSanityCheckETH() public {
        // Use native ETH = quote WETH
        IERC20 eth = IERC20(address(0));
        (AggregatorV2V3Interface clFeed, , ) = swapper.knownTokens(weth);
        assertNotEq(address(clFeed), address(0));
        vm.deal(address(this), 10 ether);

        // $3000.00 = 1 ETH, wrong price = block swap
        fakeFeedETHUSD.setPrice(300000, 2);
        vm.expectRevert(bytes("DFS: quote sanity check failed"));
        swapper.swapToCoin(eth, 1 ether, usdc, emptySwapData());

        // $3450.00 = 1 ETH, ~correct price = OK, attempt swap
        fakeFeedETHUSD.setPrice(345000, 2);
        vm.expectRevert(bytes("DFS: swap produced no output"));
        swapper.swapToCoin{value: 1 ether}(eth, 1 ether, usdc, emptySwapData());

        // Feed returning stale or missing price = block swap
        fakeFeedETHUSD.setPrice(0, 0);
        vm.expectRevert(bytes("DFS: CL price <= 0"));
        swapper.swapToCoin{value: 1 ether}(eth, 1 ether, usdc, emptySwapData());

        // No price feed = OK, attempt swap
        swapper.setKnownToken(weth, zeroToken);
        vm.expectRevert(bytes("DFS: swap produced no output"));
        swapper.swapToCoin{value: 1 ether}(eth, 1 ether, usdc, emptySwapData());
    }

    function testChainlinkSanityCheckERC20() public {
        deal(address(degen), address(this), 10e18);
        degen.approve(address(swapper), 10e18);

        // $0.50 = 1 DEGEN, wrong price = block swap
        fakeFeedDEGENUSD.setPrice(500, 3);
        vm.expectRevert(bytes("DFS: quote sanity check failed"));
        swapper.swapToCoin(degen, 1e18, usdc, emptySwapData());

        // $0.0086 = 1 DEGEN, ~correct price = OK, attempt swap
        fakeFeedDEGENUSD.setPrice(8600, 6);
        vm.expectRevert(bytes("DFS: swap produced no output"));
        swapper.swapToCoin(degen, 1 ether, usdc, emptySwapData());

        // No price = OK, attempt swap
        swapper.setKnownToken(degen, zeroToken);
        vm.expectRevert(bytes("DFS: swap produced no output"));
        swapper.swapToCoin(degen, 1e18, usdc, emptySwapData());
    }

    function testFlexSwapperQuote() public view {
        IERC20 dai = IERC20(0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb);
        uint128 amountIn = 15990000000000000000000; // $15,990 DAI

        (, bytes memory swapPath) = swapper.quote(dai, amountIn, usdc);

        // Quoter should return the direct route.
        (address tokenInAddress, address tokenOutAddress, uint24 fee) = Path
            .decodeFirstPool(swapPath);

        assertEq(tokenInAddress, address(dai));
        assertEq(tokenOutAddress, address(usdc));
        assertEq(fee, 100);
        assertEq(swapPath.length, _DIRECT_ROUTE_SWAP_LENGTH); // direct route swap path length
    }

    function testRebasingToken() public {
        IERC20 usdm = IERC20(0x28eD8909de1b3881400413Ea970ccE377a004ccA);
        deal(address(usdm), address(this), 123e18);
        usdm.approve(address(swapper), 123e18);

        // Protocol lets you unwrap 123 USDM for 122 USDC = within 1% of 1:1
        bytes memory callData = fakeSwapData(usdm, usdc, 123e18, 122e6);

        // Initially, swap fails because USDM is a rebasing token, no Uni price.
        vm.expectRevert(bytes("DFS: no path found, amountOut 0"));
        swapper.swapToCoin(usdm, 123e18, usdc, callData);

        // Give USDM a price feed + skip Uniswap. Swap should succeed.
        FakeAggregator fakeFeedUSDM = new FakeAggregator();
        fakeFeedUSDM.setPrice(1, 0); // Price = $1.00
        swapper.setKnownToken(
            usdm,
            DaimoFlexSwapper.KnownToken({
                chainlinkFeedAddr: fakeFeedUSDM,
                isStablecoin: false,
                skipUniswap: true
            })
        );
        swapper.swapToCoin(usdm, 123e18, usdc, callData);

        assertEq(usdm.balanceOf(address(this)), 0);
        assertEq(usdc.balanceOf(address(this)), 122e6);
    }

    function emptySwapData() private pure returns (bytes memory) {
        return
            abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: address(bytes20(uint160(123))),
                    callData: ""
                })
            );
    }

    function fakeSwapData(
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) private returns (bytes memory) {
        FakeDefi defi = new FakeDefi(tokenIn, tokenOut, amountIn, amountOut);
        deal(address(tokenOut), address(defi), amountOut);
        return
            abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: address(defi),
                    callData: ""
                })
            );
    }
}

contract FakeDefi {
    IERC20 private tokenIn;
    IERC20 private tokenOut;
    uint256 private amountIn;
    uint256 private amountOut;

    constructor(
        IERC20 _tokenIn,
        IERC20 _tokenOut,
        uint256 _amountIn,
        uint256 _amountOut
    ) {
        tokenIn = _tokenIn;
        tokenOut = _tokenOut;
        amountIn = _amountIn;
        amountOut = _amountOut;
    }

    fallback() external {
        tokenIn.transfer(0xdeaDDeADDEaDdeaDdEAddEADDEAdDeadDEADDEaD, amountIn);
        tokenOut.transfer(msg.sender, amountOut);
    }
}

contract FakeAggregator is AggregatorV2V3Interface {
    int256 public fakePrice;
    uint8 public fakeDecimals;

    function setPrice(int256 price, uint8 dec) public {
        fakePrice = price;
        fakeDecimals = dec;
    }

    function decimals() external view returns (uint8) {
        return fakeDecimals;
    }

    function description() external pure returns (string memory) {
        return "FAKE";
    }

    function version() external pure returns (uint256) {
        revert("unimplemented");
    }

    function getRoundData(
        uint80
    ) external pure returns (uint80, int256, uint256, uint256, uint80) {
        revert("unimplemented");
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        uint80 round = 123;
        return (round, fakePrice, uint256(0), block.timestamp, round);
    }

    function latestAnswer() external pure returns (int256) {
        revert("unimplemented");
    }

    function latestTimestamp() external pure returns (uint256) {
        revert("unimplemented");
    }

    function latestRound() external pure returns (uint256) {
        revert("unimplemented");
    }

    function getAnswer(uint256) external pure returns (int256) {
        revert("unimplemented");
    }

    function getTimestamp(uint256) external pure returns (uint256) {
        revert("unimplemented");
    }
}
