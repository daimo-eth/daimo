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
    IERC20 public degen = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed);
    address payable public alice = payable(address(0x123));
    address payable public immutable swapRouter02 =
        payable(0x2626664c2603336E57B271c5C0b26F421741e481);

    DaimoFlexSwapper public swapper;

    function setUp() public {
        require(block.chainid == 8453); // Base
        require(block.number == 14513720); // See ci.yml

        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        IERC20[] memory outputTokens = new IERC20[](2);
        outputTokens[0] = usdc;
        outputTokens[1] = weth;

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
            _knownTokenAddrs: new IERC20[](0),
            _knownTokens: new DaimoFlexSwapper.KnownToken[](0)
        });
    }

    function testNoSwap() public view {
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
        uint128 amountIn = 122 * 1e18; // from UniswapQuotes.jsonl
        uint256 expectedAmountOut = 2124053;

        (uint256 quotedAmountOut, bytes memory swapPath) = swapper.quote({
            tokenIn: degen,
            amountIn: amountIn,
            tokenOut: usdc
        });
        assertEq(quotedAmountOut, expectedAmountOut);

        // Swap degen to home coin (USDC).
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
                    callData: swapCallData
                })
            )
        });

        // Output: $2.12 USDC
        assertEq(amountOut, 2116863);

        vm.stopPrank();
    }

    function testSwapETHToUSDC() public {
        (uint256 quotedAmountOut, bytes memory swapPath) = swapper.quote({
            tokenIn: weth,
            amountIn: 1 ether,
            tokenOut: usdc
        });
        uint256 expectedAmountOut = 3036927888; // $3036.92 USDC
        assertEq(quotedAmountOut, expectedAmountOut);

        // Swap degen to home coin (USDC).
        vm.deal(alice, 9999 ether);

        vm.startPrank(alice);

        // Quote estimate: $3036.92 USDC
        // Actual output, with slippage: $3035.72 USDC
        // Slippage: 0.04%, well below the 1% limit.
        uint256 amountOut = _swapETHAsAlice(1 ether, swapPath);
        assertEq(amountOut, 3035722236);

        // Next, swap a larger amount. Hit the 2% slippage limit.
        vm.expectRevert("DFS: insufficient output");
        _swapETHAsAlice(5000 ether, swapPath);

        vm.stopPrank();
    }

    function testSwapETHToETH() public {
        // Give Alice 1 native ETH
        vm.deal(alice, 1 ether);
        assertEq(alice.balance, 1 ether);

        // Swap native ETH to WETH. This is allowed + no slippage allowed.
        bytes memory depositCalldata = abi.encodeWithSignature("deposit()");
        vm.startPrank(alice);

        // ...1 wei less = not allowed
        BadWeth wethMinus1 = new BadWeth(address(weth));
        vm.expectRevert(bytes("DFS: insufficient output"));
        swapper.swapToCoin{value: 1 ether}({
            tokenIn: IERC20(address(0)),
            amountIn: 1 ether,
            tokenOut: weth,
            extraData: abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: address(wethMinus1),
                    callData: depositCalldata
                })
            )
        });

        // 1:1 ETH to WETH = allowed
        uint256 amountOut = swapper.swapToCoin{value: 1 ether}({
            tokenIn: IERC20(address(0)),
            amountIn: 1 ether,
            tokenOut: weth,
            extraData: abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: address(weth),
                    callData: depositCalldata
                })
            )
        });
        assertEq(amountOut, 1 ether);
        assertEq(alice.balance, 0);
        assertEq(weth.balanceOf(alice), 1 ether);

        // Next, try swapping WETH to WETH. Not allowed.
        weth.approve(address(swapper), 1 ether);
        assertEq(weth.allowance(alice, address(swapper)), 1 ether);
        vm.expectRevert(bytes("DFS: input token = output token"));
        swapper.swapToCoin({
            tokenIn: weth,
            amountIn: 1 ether,
            tokenOut: weth,
            extraData: abi.encode(
                DaimoFlexSwapper.DaimoFlexSwapperExtraData({
                    callDest: address(0x0),
                    callData: ""
                })
            )
        });

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
                    callData: swapCallData
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

interface IWETH is IERC20 {
    function deposit() external payable;
}

/// Like WETH, but deposit() shorts you by 1 wei.
contract BadWeth is ERC20 {
    address public immutable weth;

    constructor(address _weth) ERC20("BadWeth", "BADWETH") {
        weth = _weth;
    }

    function deposit() public payable {
        IWETH(weth).deposit{value: msg.value - 1}();
        IERC20(weth).transfer(msg.sender, msg.value - 1);
    }
}
