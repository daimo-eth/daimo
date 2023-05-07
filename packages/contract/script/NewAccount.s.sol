// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract NewAccountScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        
        AccountFactory factory = AccountFactory(0xd730c829ba97FFeB78Dd64c477D0bE671b2767Fe); // from Deploy.s.sol
        bytes memory owner = bytes("hello");
        Account newAcc = factory.createAccount(owner, 42);
        console.log("new account address:", address(newAcc));

        vm.stopBroadcast();
    }
}
