// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./Utils.sol";

contract AccountAdminTest is Test {
    EntryPoint public entryPoint;
    DaimoAccountFactoryV2 public factory;
    DaimoAccountV2 public acc;

    function setUp() public {
        entryPoint = new EntryPoint();
        factory = new DaimoAccountFactoryV2(entryPoint);
        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));

        acc = factory.createAccount({
            homeChain: 8453, // Base
            homeCoin: IERC20(address(0)), // no home coin
            swapper: IDaimoSwapper(address(0)),
            bridger: IDaimoBridger(address(0)),
            keySlot: 0,
            key: [bytes32(uint256(1)), bytes32(uint256(2))],
            salt: 0
        });
    }

    function testUpdateHomeCoin() public {
        // Update home coin
        address dai = 0xDDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd;
        vm.prank(address(entryPoint)); // validateOp already done
        DaimoAccountV2.Call[] memory calls = new DaimoAccountV2.Call[](1);
        calls[0] = DaimoAccountV2.Call({
            dest: address(acc),
            value: 0,
            data: abi.encodeWithSelector(acc.updateHomeCoin.selector, dai)
        });
        // ...ensuring correct event log
        vm.expectEmit(true, true, true, true);
        emit DaimoAccountV2.UpdateHomeCoin(IERC20(address(0)), IERC20(dai));
        acc.executeBatch(calls);

        // Verify home chain + home coin
        assertEq(acc.homeChain(), 8453);
        assertEq(address(acc.homeCoin()), dai);
    }
}
