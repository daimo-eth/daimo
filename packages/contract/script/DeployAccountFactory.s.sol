// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
        IEntryPoint entryPoint = IEntryPoint(
            0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
        );

        // From https://github.com/daimo-eth/eip-7212
        address verifier = 0xA77aB3533750B0C4b229e441fEe37f13c65A2b1F;

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
