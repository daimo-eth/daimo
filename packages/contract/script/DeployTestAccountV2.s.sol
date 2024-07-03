// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "../src/DaimoUSDCSwapper.sol";
import "../src/DaimoCCTPBridger.sol";
import "./Constants.s.sol";

contract DeployScript is Script {
    function run(
        DaimoAccountFactoryV2 factory,
        DaimoUSDCSwapper swapper,
        DaimoCCTPBridger bridger
    ) public {
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

        factory.createAccount(
            BASE_TESTNET, // Base Sepolia is the home chain
            IERC20(_getUSDCAddress(BASE_TESTNET)), // USDC is the home coin
            swapper,
            bridger,
            0,
            key,
            0
        );

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
