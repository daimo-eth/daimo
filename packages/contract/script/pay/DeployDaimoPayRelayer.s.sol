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
            keccak256("DaimoPayRelayer-9"),
            abi.encodePacked(
                type(DaimoPayRelayer).creationCode,
                abi.encode(owner)
            )
        );

        console.log("daimoPayRelayer deployed at address:", daimoPayRelayer);

        address startAndClaimRelayer = 0xA602141Bfc2577A37B43D6156728b09c900b33c3;
        DaimoPayRelayer(payable(daimoPayRelayer)).grantRelayerEOARole(
            startAndClaimRelayer
        );
        console.log("Relayer role granted to", startAndClaimRelayer);

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
