// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/DaimoFlexSwapper.sol";
import "../dummy/DaimoDummyUSDC.sol";

contract SwapperTest is Test {
    IERC20 public usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 public weth = IERC20(0x4200000000000000000000000000000000000006);
    address payable public immutable swapRouter02 =
        payable(0x2626664c2603336E57B271c5C0b26F421741e481);

    DaimoFlexSwapper public swapper;

    function setUp() public {
        require(block.chainid == 8453); // Base
        require(block.number == 14513720); // See ci.yml

        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        IERC20[] memory outputTokens = new IERC20[](1);
        outputTokens[0] = usdc;

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
            _stablecoins: new IERC20[](0),
            _swapRouter02: 0x2626664c2603336E57B271c5C0b26F421741e481,
            _oracleFeeTiers: oracleFeeTiers,
            _oraclePeriod: 1 minutes,
            _oraclePoolFactory: IUniswapV3Factory(
                0x33128a8fC17869897dcE68Ed026d694621f6FDfD
            )
        });

        assert(block.number == 14513720); // These tests are block number / chain config dependent
    }

    function testNoSwap() public {
        (uint256 quotedAmountOut, bytes memory swapPath) = swapper.quote({
            tokenIn: usdc,
            amountIn: 100,
            tokenOut: usdc
        });
        // If tokenIn == tokenOut, there should be no swap path.
        assertEq(swapPath, new bytes(0));
        assertEq(quotedAmountOut, 100);
    }

    function testSwapERC20ToUSDC() public {
        // Now quote a true swap path (DEGEN -> USDC).
        // Input: 122 DEGEN
        IERC20 degen = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed);
        uint128 amountIn = 122 * 1e18; // from UniswapQuotes.jsonl
        uint256 expectedAmountOut = 2124053;

        (uint256 quotedAmountOut, bytes memory swapPath) = swapper.quote({
            tokenIn: degen,
            amountIn: amountIn,
            tokenOut: usdc
        });
        assertEq(quotedAmountOut, expectedAmountOut);

        // Swap degen to home coin (USDC).
        address alice = address(0x123);
        vm.startPrank(alice);
        deal(address(weth), alice, 1e18);
        deal(address(degen), alice, amountIn);

        degen.approve(address(swapper), amountIn);

        bytes memory swapCallData = abi.encodeWithSignature(
            "exactInput((bytes,address,uint256,uint256))",
            ExactInputParams({
                swapPath: swapPath,
                recipient: address(swapper),
                amountIn: 0, // swap entire amount transferred.
                amountOutMinimum: 0 // no minimum, swapper validates instead.
            })
        );

        uint256 amountOut = swapper.swapToCoin({
            tokenIn: degen,
            amountIn: amountIn,
            tokenOut: usdc,
            extraData: abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: swapRouter02,
                    callData: swapCallData,
                    tipToExactAmountOut: 0,
                    tipPayer: address(0x0)
                })
            )
        });

        // Output: $2.12 USDC
        assertEq(amountOut, 2116863);

        vm.stopPrank();
    }

    function testSwapETHToUSDC() public {
        (uint256 quotedAmountOut, bytes memory swapPath) = swapper.quote({
            tokenIn: IERC20(address(0)), // ETH
            amountIn: 1 ether,
            tokenOut: usdc
        });
        uint256 expectedAmountOut = 3036927888; // $3036.92 USDC
        assertEq(quotedAmountOut, expectedAmountOut);

        // Swap degen to home coin (USDC).
        address alice = address(0x123);
        vm.deal(alice, 9999 ether);

        vm.startPrank(alice);

        // Quote estimate: $3036.92 USDC
        // Actual output, with slippage: $3035.72 USDC
        // Slippage: 0.04%, well below the 1% limit.
        uint256 amountOut = _swapETHAsAlice(1 ether, swapPath);
        assertEq(amountOut, 3035722236);

        // Next, swap a larger amount. Hit the 1% slippage limit.
        // Actual output: $2,993,949 USDC = 1.4% slippage.
        vm.expectRevert("DFS: insufficient output");
        _swapETHAsAlice(1000 ether, swapPath);

        vm.stopPrank();
    }

    function _swapETHAsAlice(
        uint256 amountIn,
        bytes memory swapPath
    ) private returns (uint256 amountOut) {
        // Alice calls swapToCoin(), passing value: amountIn native ETH.
        bytes[] memory swapCalls = new bytes[](2);
        swapCalls[0] = abi.encodeWithSignature("wrapETH(uint256)", amountIn);
        swapCalls[1] = abi.encodeWithSignature(
            "exactInput((bytes,address,uint256,uint256))",
            ExactInputParams({
                swapPath: swapPath,
                recipient: address(swapper),
                amountIn: 0,
                amountOutMinimum: 0
            })
        );
        bytes memory swapCallData = abi.encodeWithSignature(
            "multicall(bytes[])",
            swapCalls
        );

        amountOut = swapper.swapToCoin{value: amountIn}({
            tokenIn: IERC20(address(0)), // ETH
            amountIn: amountIn,
            tokenOut: usdc,
            extraData: abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: swapRouter02,
                    callData: swapCallData,
                    tipToExactAmountOut: 0,
                    tipPayer: address(0x0)
                })
            )
        });
    }

    /// SwapRouter02.exactInput() params
    struct ExactInputParams {
        bytes swapPath;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }
}
