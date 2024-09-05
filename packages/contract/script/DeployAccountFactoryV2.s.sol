// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactoryV2.sol";

contract DeployAccountFactoryV2Script is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
        IEntryPoint entryPoint = IEntryPoint(
            0x0000000071727De22E5E9d8BAf0edAc6f37da032
        );

        DaimoAccountFactoryV2 factory = new DaimoAccountFactoryV2{salt: 0}(
            entryPoint
        );
        console.log("factory address:", address(factory));

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
