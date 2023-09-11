// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "openzeppelin-contracts/contracts/proxy/transparent/ProxyAdmin.sol";
import "openzeppelin-contracts/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "../src/DaimoNameRegistry.sol";

contract DeployNameRegistryScript is Script {
    function run() public {
        vm.startBroadcast();

        // Create an proxy admin.
        // TransparentUpgradeableProxy admin and owner must be separate.
        // Admin should be a Proxy Admin.
        ProxyAdmin admin = new ProxyAdmin();

        // Use CREATE2
        address registry = address(new DaimoNameRegistry{salt: 0}());
        new TransparentUpgradeableProxy{salt: 0}(
            address(registry), // implementation
            address(admin), // admin
            abi.encodeWithSelector(DaimoNameRegistry.init.selector, hex"")
        );

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
