// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        IEntryPoint entryPoint = IEntryPoint(0x0F46c65C17AA6b4102046935F33301f0510B163A);
        
        AccountFactory factory = new AccountFactory(entryPoint);
        console.log("factory address:", address(factory));

        vm.stopBroadcast();
    }
}
