// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoSwapbotTipmaster.sol";

contract DeploySwapbotTipmaster is Script {
    function run(address owner) public {
        vm.startBroadcast();

        new SwapbotTipmaster{salt: 0}(owner);

        vm.stopBroadcast();
    }
}
