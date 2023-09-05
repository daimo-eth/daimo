// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoNameRegistry.sol";

contract DeployNameRegistryScript is Script {
    function run() public {
        vm.startBroadcast();

        // Use CREATE2
        new NameRegistry{salt: 0}();

        vm.stopBroadcast();
    }
}
