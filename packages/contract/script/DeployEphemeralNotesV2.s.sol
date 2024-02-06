// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoEphemeralNotesV2.sol";

contract DeployEphemeralNotesV2Script is Script {
    function run() public {
        address coinAddress = address(0x0);
        if (block.chainid == 84532) {
            coinAddress = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        }

        vm.startBroadcast();
        new DaimoEphemeralNotesV2{salt: 0}(IERC20(coinAddress));
        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
