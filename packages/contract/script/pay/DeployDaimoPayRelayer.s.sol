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
            keccak256("DaimoPayRelayer-8"),
            abi.encodePacked(
                type(DaimoPayRelayer).creationCode,
                abi.encode(owner)
            )
        );

        console.log("daimoPayRelayer deployed at address:", daimoPayRelayer);

        address relayer = 0x723A63fb50dA50A26997Fb99A2Eb151E4F8c5227;
        DaimoPayRelayer(payable(daimoPayRelayer)).grantRelayerRole(relayer);
        console.log("Relayer role granted to", relayer);

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
