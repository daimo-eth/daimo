// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../Constants.s.sol";
import "../../src/pay/DaimoPayRelayer.sol";

contract DeployDaimoPayRelayer is Script {
    function run() public {
        address owner = msg.sender;

        vm.startBroadcast();

        address daimoPayRelayer = CREATE3.deploy(
            keccak256("DaimoPayRelayer-11"),
            abi.encodePacked(
                type(DaimoPayRelayer).creationCode,
                abi.encode(owner)
            )
        );

        console.log("daimoPayRelayer deployed at address:", daimoPayRelayer);

        address[] memory additionalRelayers = new address[](2);
        additionalRelayers[0] = 0xA602141Bfc2577A37B43D6156728b09c900b33c3; // startAndClaimRelayer
        additionalRelayers[1] = 0x2F321372E8A9755CD2Ca6114eB8da32A14F8100b; // dev relayer

        for (uint256 i = 0; i < additionalRelayers.length; i++) {
            DaimoPayRelayer(payable(daimoPayRelayer)).grantRelayerEOARole(
                additionalRelayers[i]
            );
            console.log("Relayer role granted to", additionalRelayers[i]);
        }

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
