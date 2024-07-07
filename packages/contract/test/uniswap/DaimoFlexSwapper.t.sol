// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

import "../../src/DaimoFlexSwapper.sol";
import "../Utils.sol";
import "../../src/DaimoTestUSDC.sol";

contract SwapperTest is Test {
    struct DaimoFlexSwapperExtraData {
        bytes swapPath;
        uint128 altruisticAmountOut;
        address altruisticSender;
    }

    IERC20 public tokenIn;
    IERC20 public usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 public weth = IERC20(0x4200000000000000000000000000000000000006);
    DaimoFlexSwapper public swapper;

    address public constant ALICE = address(0x123);

    function setUp() public {
        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        IERC20[] memory outputTokens = new IERC20[](1);
        outputTokens[0] = usdc;

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        swapper = new DaimoFlexSwapper({
            _wrappedNativeToken: weth,
            _hopTokens: hopTokens,
            _outputTokens: outputTokens,
            _swapRouter02: 0x2626664c2603336E57B271c5C0b26F421741e481,
            _oracleFeeTiers: oracleFeeTiers,
            _oraclePeriod: 1 minutes,
            _oraclePoolFactory: IUniswapV3Factory(
                0x33128a8fC17869897dcE68Ed026d694621f6FDfD
            )
        });

        assert(block.number == 14513720); // These tests are block number / chain config dependent
    }

    function testSwapToBridgeableCoin() public {
        tokenIn = usdc;
        (uint256 quotedAmountOut, bytes memory swapPath) = swapper.quote(
            tokenIn,
            100, // amountIn
            usdc
        );
        // If tokenIn == tokenOut, there should be no swap path.
        assertEq(swapPath, new bytes(0));

        // Now quote a true swap path (DEGEN -> USDC).
        tokenIn = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed);
        uint128 amountIn = 122000000000000000000; // from UniswapQuotes.jsonl
        uint256 expectedAmountOut = 2124053;

        (quotedAmountOut, swapPath) = swapper.quote(tokenIn, amountIn, usdc);
        assertEq(quotedAmountOut / 10 ** 4, expectedAmountOut / 10 ** 4); // in cents

        // Swap degen to home coin (USDC).
        vm.startPrank(ALICE);
        deal(address(weth), ALICE, 1e18);
        deal(address(tokenIn), ALICE, amountIn);

        tokenIn.approve(address(swapper), amountIn);
        weth.approve(address(swapper), 1e18);

        tokenIn.approve(
            address(0x2626664c2603336E57B271c5C0b26F421741e481),
            amountIn
        );
        weth.approve(address(0x2626664c2603336E57B271c5C0b26F421741e481), 1e18);

        // bytes memory extraData = abi.encode(
        //     DaimoFlexSwapperExtraData({
        //         swapPath: swapPath,
        //         altruisticAmountOut: 0,
        //         altruisticSender: ALICE
        //     })
        // );

        // (uint256 amountOut, IERC20 tokenOut) = swapper.swapToBridgableCoin(
        //     amountIn,
        //     tokenIn,
        //     extraData
        // );

        // vm.stopPrank();
    }
}
