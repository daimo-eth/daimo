// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        
        AccountFactory factory = AccountFactory(0x4BDE879aaBbe894f6dC2e072b4bE7F6a75a765F2);
        address nullOwner = address(0);
        Account newAcc = factory.createAccount(nullOwner, 42);
        console.log("new account address:", address(newAcc));

        vm.stopBroadcast();
    }
}
