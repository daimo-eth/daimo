// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";

contract DeployScript is Script {
    function run(DaimoAccountFactory factory) public {
        vm.startBroadcast();

        // hardcoded from swift playground
        bytes32[2] memory key = [
            bytes32(
                hex"65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4"
            ),
            bytes32(
                hex"4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437"
            )
        ];

        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);

        uint8[] memory slots = new uint8[](1);
        slots[0] = 0;

        bytes32[2][] memory initKeys = new bytes32[2][](1);
        initKeys[0] = key;

        factory.createAccount(slots, initKeys, 1, calls, 0);

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
