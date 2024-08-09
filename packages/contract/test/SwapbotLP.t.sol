// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/DaimoSwapbotLP.sol";
import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./dummy/DaimoDummyUSDC.sol";
import "./dummy/DaimoDummySwapper.sol";
import "./dummy/DaimoDummyBridger.sol";

contract SwapbotLPTest is Test {
    TestUSDC public opUSDCe = new TestUSDC{salt: bytes32(uint256(1))}();
    TestUSDC public opUSDC = new TestUSDC{salt: bytes32(uint256(2))}();
    TestUSDC public baseUSDbC = new TestUSDC{salt: bytes32(uint256(3))}();
    TestUSDC public baseUSDC = new TestUSDC{salt: bytes32(uint256(4))}();

    DummySwapper public swapper =
        new DummySwapper{salt: 0}(opUSDCe, opUSDC, baseUSDbC, baseUSDC);
    DummyBridger public bridger =
        new DummyBridger{salt: 0}(opUSDC, 8453, hex"1234");
    DummyUniswap public uni =
        new DummyUniswap{salt: 0}(baseUSDbC, baseUSDC, 100, 97);

    address public swapbotEOA = makeAddr("swapbotEOA");

    SwapbotLP public lp;
    DaimoAccountV2 public acc;

    function setUp() public {
        // Create a test Daimo account
        EntryPoint entryPoint = new EntryPoint{salt: 0}();
        DaimoAccountFactoryV2 factory = new DaimoAccountFactoryV2{salt: 0}(
            entryPoint
        );
        acc = factory.createAccount({
            homeChain: 8453,
            homeCoin: baseUSDC,
            swapper: swapper,
            bridger: bridger,
            keySlot: 0,
            key: [bytes32(uint256(1)), bytes32(uint256(2))],
            salt: 0
        });

        lp = new SwapbotLP(swapbotEOA);

        // Equip swapbot EOA and swapper for tip and output token, respectively
        deal(address(baseUSDC), address(lp), 10);
        deal(address(baseUSDC), address(uni), 1e6);
    }

    function testRun() public {
        vm.chainId(8453);
        baseUSDbC.transfer(address(acc), 100);

        // Reentrant call into SwapbotLP.swapAndTip()
        bytes memory extraData = abi.encode(
            DummySwapper.DummySwapperExtraData({
                callDest: address(lp),
                callData: abi.encodeWithSelector(
                    SwapbotLP.swapAndTip.selector,
                    baseUSDbC,
                    100,
                    baseUSDC,
                    address(uni),
                    abi.encodeWithSelector(DummyUniswap.swap.selector)
                )
            })
        );

        // Create a swapToHomeCoin() action
        bytes memory swapCallData = abi.encodeWithSelector(
            DaimoAccountV2.swapToHomeCoin.selector,
            baseUSDbC,
            100,
            extraData
        );

        SwapbotLP.SwapbotAction memory action = SwapbotLP.SwapbotAction({
            actioneeAddr: address(acc),
            callData: swapCallData,
            isSwapAndTip: true,
            tokenOutAddr: address(baseUSDC), // tip in output token
            tipAmounts: bytes32((uint256(100) << 128) | uint256(4))
        });

        // Run the swap action
        vm.prank(swapbotEOA);
        lp.run(abi.encode(action));

        // Check that the account received the correct amount of USDC
        // (swapper rate is 100:97 --> but tip should bring it to 1:1)
        assertEq(baseUSDbC.balanceOf(address(acc)), 0);
        assertEq(baseUSDC.balanceOf(address(acc)), 100);

        // Check that the swapbot EOA provided the tip
        assertEq(baseUSDC.balanceOf(address(lp)), 7);
    }
}

contract DummyUniswap {
    IERC20 public tokenIn;
    IERC20 public tokenOut;
    uint256 public amountIn;
    uint256 public amountOut;

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

    function swap() public {
        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        tokenOut.transfer(msg.sender, amountOut);
    }
}
