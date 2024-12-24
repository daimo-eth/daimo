// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import {CREATE3Factory} from "../vendor/create3/CREATE3Factory.sol";

contract DeployScript is Script {
    function run() public returns (CREATE3Factory factory) {
        vm.startBroadcast();

        bytes32 salt = keccak256("CREATE3Factory");

        factory = new CREATE3Factory{salt: salt}();

        console.log("CREATE3Factory deployed to:", address(factory));

        vm.stopBroadcast();
    }
}
