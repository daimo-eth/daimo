// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        Account newAcc = Account(payable(0x8d8EF8951CDaA930Df9D1a070615eF57d4c6AbC8));
        console.log("new account address:", address(newAcc));
        bytes memory data = hex"00";
        newAcc.execute(0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB, 0.05 ether, data);

        vm.stopBroadcast();
    }
}
