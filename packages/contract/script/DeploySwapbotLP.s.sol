// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoSwapbotLP.sol";

contract DeploySwapbotLP is Script {
    function run(address owner) public {
        vm.startBroadcast();

        new SwapbotLP{salt: 0}(owner);

        vm.stopBroadcast();
    }
}
