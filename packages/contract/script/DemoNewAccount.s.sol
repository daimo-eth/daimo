// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract DemoNewAccountScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        
        AccountFactory factory = AccountFactory(0xd730c829ba97FFeB78Dd64c477D0bE671b2767Fe); // from Deploy.s.sol
        bytes32[2] memory key = [bytes32(hex"65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4"), bytes32(hex"4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437")];
        Account newAcc = factory.createAccount(key, 42);
        console.log("new account address:", address(newAcc));

        vm.stopBroadcast();
    }
}
