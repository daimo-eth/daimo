// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./dummy/DaimoDummyUSDC.sol";

contract TestUSDCTest is Test {
    function testCoin() public {
        TestUSDC usdc = new TestUSDC();
        assertEq(usdc.balanceOf(address(this)), 1e12);
        assertEq(usdc.balanceOf(address(0)), 0);
        assertEq(usdc.decimals(), 6);
        assertEq(usdc.symbol(), "USDC");
        assertEq(usdc.name(), "testUSDC");
        // Rest is inherited from OpenZeppelin ERC20, already well tested.
    }
}
