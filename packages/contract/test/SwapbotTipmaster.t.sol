// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/DaimoSwapbotTipmaster.sol";
import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./dummy/DaimoDummyUSDC.sol";
import "./dummy/DaimoDummySwapper.sol";
import "./dummy/DaimoDummyBridger.sol";

contract SwapbotTipmasterTest is Test {
    TestUSDC public opUSDCe = new TestUSDC{salt: bytes32(uint256(1))}();
    TestUSDC public opUSDC = new TestUSDC{salt: bytes32(uint256(2))}();
    TestUSDC public baseUSDbC = new TestUSDC{salt: bytes32(uint256(3))}();
    TestUSDC public baseUSDC = new TestUSDC{salt: bytes32(uint256(4))}();

    DummySwapper public swapper =
        new DummySwapper{salt: 0}(opUSDCe, opUSDC, baseUSDbC, baseUSDC);
    DummyBridger public bridger =
        new DummyBridger{salt: 0}(opUSDC, 8453, hex"1234");

    address public swapbotEOA = makeAddr("swapbotEOA");

    SwapbotTipmaster public tipmaster;
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

        tipmaster = new SwapbotTipmaster(swapbotEOA);

        // Equip swapbot EOA and swapper for tip and output token, respectively
        deal(address(baseUSDC), address(tipmaster), 100);
        deal(address(baseUSDC), address(swapper), 1e6);
    }

    function testRun() public {
        vm.chainId(8453);
        baseUSDbC.transfer(address(acc), 100);

        bytes memory extraData = abi.encode(
            DummySwapper.DummySwapperExtraData({
                tipToExactAmountOut: 100, // 1:1 for stablecoins
                tipPayer: address(tipmaster)
            })
        );

        // Create a swapToHomeCoin() action
        bytes memory swapCallData = abi.encodeWithSelector(
            DaimoAccountV2.swapToHomeCoin.selector,
            baseUSDbC,
            100,
            extraData
        );

        SwapbotTipmaster.SwapAction memory action = SwapbotTipmaster
            .SwapAction({
                daimoAccountAddr: address(acc),
                callData: swapCallData,
                swapperAddr: address(swapper),
                tokenTipAddr: address(baseUSDC), // tip in output token
                maxTipAmount: 4 // max tip is 4% of input
            });

        // Run the swap action
        tipmaster.run(abi.encode(action));

        // Check that the allowance was set back to 0
        assertEq(
            IERC20(action.tokenTipAddr).allowance(
                address(tipmaster),
                action.swapperAddr
            ),
            0
        );

        // Check that the account received the correct amount of USDC
        // (swapper rate is 100:97 --> but tip should bring it to 1:1)
        assertEq(baseUSDbC.balanceOf(address(acc)), 0);
        assertEq(baseUSDC.balanceOf(address(acc)), 100);

        // Check that the swapbot EOA provided the tip
        assertEq(baseUSDC.balanceOf(address(tipmaster)), 97);
    }
}
