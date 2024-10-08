// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../Constants.s.sol";
import "../../src/pay/DaimoPayLP.sol";

contract DeployDaimoPayLP is Script {
    function run() public {
        address owner = msg.sender;

        vm.startBroadcast();

        address daimoPayLP = CREATE3.deploy(
            keccak256("DaimoPayLP-test1"),
            abi.encodePacked(type(DaimoPayLP).creationCode, abi.encode(owner))
        );

        console.log("daimoPayLP deployed at address:", daimoPayLP);

        vm.stopBroadcast();
    }
}
