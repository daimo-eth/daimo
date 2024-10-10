// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "../../src/pay/DaimoPay.sol";
import "../Constants.s.sol";

contract DeployDaimoPay is Script {
    function run() public {
        vm.startBroadcast();

        address handoffFactory = CREATE3.getDeployed(
            msg.sender,
            keccak256("PayIntentFactory-test1")
        );
        address bridger = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayBridger-test1")
        );

        console.log("using handoff factory at", handoffFactory);

        address daimoPay = CREATE3.deploy(
            keccak256("DaimoPay-test1"),
            abi.encodePacked(
                type(DaimoPay).creationCode,
                abi.encode(handoffFactory, bridger)
            )
        );

        vm.stopBroadcast();

        console.log("daimo pay deployed at address:", daimoPay);
    }

    // Exclude from forge coverage
    function test() public {}
}
