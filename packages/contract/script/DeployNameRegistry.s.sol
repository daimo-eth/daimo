// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoNameRegistry.sol";
import "../src/DaimoNameRegistryProxy.sol";

contract DeployNameRegistryScript is Script {
    function run() public {
        vm.startBroadcast();

        // Use CREATE2
        address registry = address(new DaimoNameRegistry{salt: 0}());
        new DaimoNameRegistryProxy{salt: 0}(
            address(registry), // implementation
            abi.encodeWithSelector(DaimoNameRegistry.init.selector, hex"")
        );

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
