// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "@uniswap/v3-periphery/contracts/libraries/Path.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/DaimoFlexSwapper.sol";

// Test onchain route-finder and quoter.
contract QuoterTest is Test {
    IERC20 public tokenIn;
    IERC20 public usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 public weth = IERC20(0x4200000000000000000000000000000000000006);
    IERC20 public degen = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed);

    FakeAggregator public fakeFeedETHUSD = new FakeAggregator();
    FakeAggregator public fakeFeedDEGENUSD = new FakeAggregator();

    DaimoFlexSwapper public swapper;
    uint256 private constant _DIRECT_ROUTE_SWAP_LENGTH = 43;

    function setUp() public {
        assert(block.chainid == 8453);
        assert(block.number == 15950101); // Block specific test

        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        IERC20[] memory stablecoins = new IERC20[](1);
        stablecoins[0] = usdc;

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        IERC20[] memory feedTokens = new IERC20[](2);
        feedTokens[0] = weth;
        feedTokens[1] = degen;

        AggregatorV2V3Interface[]
            memory feedAggregators = new AggregatorV2V3Interface[](2);
        feedAggregators[0] = fakeFeedETHUSD;
        feedAggregators[1] = fakeFeedDEGENUSD;

        address swapperImpl = address(new DaimoFlexSwapper());
        swapper = DaimoFlexSwapper(address(new ERC1967Proxy(swapperImpl, "")));

        swapper.init({
            _initialOwner: address(this),
            _wrappedNativeToken: weth,
            _hopTokens: hopTokens,
            _outputTokens: stablecoins,
            _stablecoins: stablecoins,
            _oracleFeeTiers: oracleFeeTiers,
            _oraclePeriod: 1 minutes,
            _oraclePoolFactory: IUniswapV3Factory(
                0x33128a8fC17869897dcE68Ed026d694621f6FDfD
            ),
            _feedTokens: feedTokens,
            _feedAggregators: feedAggregators,
            _maxFeedRoundAge: 0
        });
    }

    function testChainlinkSanityCheckETH() public {
        // Use native ETH = quote WETH
        IERC20 eth = IERC20(address(0));
        assertNotEq(address(swapper.feedRegistry(weth)), address(0));
        vm.deal(address(this), 10 ether);

        // $3000.00 = 1 ETH, wrong price = block swap
        fakeFeedETHUSD.setPrice(300000, 2);
        vm.expectRevert(bytes("DFS: quote sanity check failed"));
        swapper.swapToCoin(eth, 1 ether, usdc, emptySwapData());

        // $3450.00 = 1 ETH, ~correct price = OK, attempt swap
        fakeFeedETHUSD.setPrice(345000, 2);
        vm.expectRevert(bytes("DFS: swap produced no output"));
        swapper.swapToCoin{value: 1 ether}(eth, 1 ether, usdc, emptySwapData());

        // No price = OK, attempt swap
        vm.deal(address(this), 10 ether);
        fakeFeedETHUSD.setPrice(0, 0);
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
        vm.deal(address(this), 10 ether);
        fakeFeedDEGENUSD.setPrice(0, 0);
        vm.expectRevert(bytes("DFS: swap produced no output"));
        swapper.swapToCoin(degen, 1 ether, usdc, emptySwapData());
    }

    function testFlexSwapperQuote() public {
        tokenIn = IERC20(0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb); // DAI
        uint128 amountIn = 15990000000000000000000; // $15,990 DAI

        (, bytes memory swapPath) = swapper.quote(tokenIn, amountIn, usdc);

        // Quoter should return the direct route.
        (address tokenInAddress, address tokenOutAddress, uint24 fee) = Path
            .decodeFirstPool(swapPath);

        assertEq(tokenInAddress, address(tokenIn));
        assertEq(tokenOutAddress, address(usdc));
        assertEq(fee, 100);
        assertEq(swapPath.length, _DIRECT_ROUTE_SWAP_LENGTH); // direct route swap path length
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
