// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/CrepeBotLP.sol";

contract DeployCrepeLPBot is Script {
    function run() public {
        address owner = msg.sender;

        vm.startBroadcast();

        new CrepeBotLP{salt: 0}(owner);

        vm.stopBroadcast();
    }
}
