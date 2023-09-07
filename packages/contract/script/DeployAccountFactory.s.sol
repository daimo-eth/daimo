// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoTestUSDC.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
        IEntryPoint entryPoint = IEntryPoint(
            0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
        );

        P256SHA256 verifier = P256SHA256(
            0xc9841f04bDD61aA0f466FeE841c261A92c87aA9c // From DeployP256SHA256
        );

        AccountFactory factory = new AccountFactory{salt: 0}(
            entryPoint,
            verifier
        );
        console.log("factory address:", address(factory));

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
