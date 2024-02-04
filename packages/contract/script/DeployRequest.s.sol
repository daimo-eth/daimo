// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoRequest.sol";

contract DeployRequestScript is Script {
    function run() public {
        vm.startBroadcast();
        // DaimoRequest defaults to USDC on Base.
        new DaimoRequest{salt: 0}(IERC20(address(0x0)));
        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
