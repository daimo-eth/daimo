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
            0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
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
