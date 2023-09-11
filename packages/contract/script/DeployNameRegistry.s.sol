// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/DaimoNameRegistry.sol";

contract DeployNameRegistryScript is Script {
    function run() public {
        vm.startBroadcast();

        // Use CREATE2
        address registry = address(new NameRegistry{salt: 0}());
        address proxy = address(new ERC1967Proxy{salt: 0}(registry, hex""));

        vm.stopBroadcast();

        console2.log("implementation NameRegistry: ", registry);
        console2.log("implementation proxy: ", proxy);
    }

    // Exclude from forge coverage
    function test() public {}
}
