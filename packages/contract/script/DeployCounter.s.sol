// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Counter.sol";

contract DeployCounter is Script {
    function run() public {
        vm.broadcast();
        new Counter{salt: 0}();
    }

    // Exclude from forge coverage
    function test() public {}
}
