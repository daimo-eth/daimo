// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoEphemeralNotesV2.sol";

contract DeployEphemeralNotesV2Script is Script {
    function run() public {
        vm.startBroadcast();
        // DaimoEphemeralNotesV2 defaults to USDC on Base.
        new DaimoEphemeralNotesV2{salt: 0}(IERC20(address(0x0)));
        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
