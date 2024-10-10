// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/CrepeFastCCTP.sol";

import "./Constants.s.sol";

contract DeployCrepeHandoffFactoryScript is Script {
    function run() public {
        vm.startBroadcast();

        address handoffFactory = CREATE3.deploy(
            keccak256("CrepeHandoffFactory-test3"),
            abi.encodePacked(
                type(CrepeHandoffFactory).creationCode,
                abi.encode()
            )
        );

        vm.stopBroadcast();

        console.log(
            "crepe handoff factory deployed at address:",
            handoffFactory
        );
    }

    // Exclude from forge coverage
    function test() public {}
}
