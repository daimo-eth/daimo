// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/CrepeFastCCTP.sol";

import "./Constants.s.sol";

contract DeployCrepeFastCCTPScript is Script {
    function run() public {
        address tokenMinter = _getTokenMinterAddress(block.chainid);
        address tokenMessenger = _getTokenMessengerAddress(block.chainid);

        vm.startBroadcast();

        address handoffFactory = CREATE3.getDeployed(
            msg.sender,
            keccak256("CrepeHandoffFactory-test3")
        );

        console.log("using handoff factory at", handoffFactory);

        address fastCCTP = CREATE3.deploy(
            keccak256("CrepeFastCCTP-test4"),
            abi.encodePacked(
                type(CrepeFastCCTP).creationCode,
                abi.encode(tokenMinter, tokenMessenger, handoffFactory)
            )
        );

        vm.stopBroadcast();

        console.log("crepe fast cctp deployed at address:", fastCCTP);
    }

    // Exclude from forge coverage
    function test() public {}
}
