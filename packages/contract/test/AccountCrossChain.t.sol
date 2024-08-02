// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./dummy/DaimoDummyUSDC.sol";
import "./dummy/DaimoDummySwapper.sol";
import "./dummy/DaimoDummyBridger.sol";

contract AccountCrossChainTest is Test {
    TestUSDC public opUSDCe = new TestUSDC{salt: bytes32(uint256(1))}();
    TestUSDC public opUSDC = new TestUSDC{salt: bytes32(uint256(2))}();
    TestUSDC public baseUSDbC = new TestUSDC{salt: bytes32(uint256(3))}();
    TestUSDC public baseUSDC = new TestUSDC{salt: bytes32(uint256(4))}();

    DummySwapper public swapper =
        new DummySwapper{salt: 0}(opUSDCe, opUSDC, baseUSDbC, baseUSDC);
    DummyBridger public bridger =
        new DummyBridger{salt: 0}(opUSDC, 8453, hex"1234");

    DaimoAccountFactoryV2 public factory;
    DaimoAccountV2 public acc;

    function setUp() public {
        EntryPoint entryPoint = new EntryPoint{salt: 0}();
        factory = new DaimoAccountFactoryV2{salt: 0}(entryPoint);
        acc = factory.createAccount({
            homeChain: 8453,
            homeCoin: baseUSDC,
            swapper: swapper,
            bridger: bridger,
            keySlot: 0,
            key: [bytes32(uint256(1)), bytes32(uint256(2))],
            salt: 0
        });

        // Let DummySwapper send output coins
        opUSDC.transfer(address(swapper), 1e6);
        baseUSDC.transfer(address(swapper), 1e6);

        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        console.log("account address:", address(acc));
        console.log("opUSDCe address:", address(opUSDCe));
        console.log("opUSDC address:", address(opUSDC));
        console.log("baseUSDbC address:", address(baseUSDbC));
        console.log("baseUSDC address:", address(baseUSDC));
    }

    function testCollect() public {
        // Send wrong coin on chain A
        vm.chainId(10);
        opUSDCe.transfer(address(acc), 100);
        assertEq(opUSDCe.balanceOf(address(acc)), 100);

        // Collect (swap + bridge) on home chain = chain B
        acc.collect(opUSDCe, 100, opUSDC, "", hex"1234");

        // Check balances
        assertEq(opUSDCe.balanceOf(address(acc)), 0);
        assertEq(opUSDC.balanceOf(address(acc)), 0);

        // Check that the bridge was started
        assertEq(bridger.bridges(address(acc)), 97);
    }

    function testSwapToCoin() public {
        // Send wrong coin on home chain B
        vm.chainId(8453);
        baseUSDbC.transfer(address(acc), 100);

        // Call swapToHomeCoin() to auto-swap
        acc.swapToHomeCoin(baseUSDbC, 100, "");

        // Check balances
        assertEq(baseUSDbC.balanceOf(address(acc)), 0);
        assertEq(baseUSDC.balanceOf(address(acc)), 97);
    }

    function testForward() public {
        vm.expectRevert("DAv2: not forwarding");
        acc.forward(baseUSDC);

        vm.expectRevert("DAv2: only self");
        address payable s = payable(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF);
        acc.setForwardingAddress(s);

        // Alice deactivates the account, forwarding to s
        vm.prank(address(acc));
        acc.setForwardingAddress(s);

        // Receive $1 into deactivated account
        baseUSDC.transfer(address(acc), 1e6);

        // Anyone can forward, not just the account owner
        uint256 prevUSDC = baseUSDC.balanceOf(s);
        acc.forward(baseUSDC);
        assertEq(baseUSDC.balanceOf(address(acc)), 0);
        assertEq(baseUSDC.balanceOf(s) - prevUSDC, 1e6);

        // Finally, test forwarding ETH
        vm.deal(address(acc), 1 ether);

        uint256 prevETH = s.balance; // address 0xfff.. has a bit of ETH on base
        acc.forward(IERC20(address(0)));
        assertEq(address(acc).balance, 0);
        assertEq(s.balance - prevETH, 1 ether);
    }
}
