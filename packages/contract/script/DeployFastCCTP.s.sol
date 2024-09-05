// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoFastCCTP.sol";

import "./Constants.s.sol";

contract DeployFastCCTPScript is Script {
    function run() public {
        address tokenMinter = _getTokenMinterAddress(block.chainid);

        vm.startBroadcast();

        address fastCCTP = CREATE3.deploy(
            keccak256("DaimoFastCCTP-1"),
            abi.encodePacked(
                type(DaimoFastCCTP).creationCode,
                abi.encode(tokenMinter)
            )
        );

        vm.stopBroadcast();

        console.log("fastcctp deployed at address:", fastCCTP);
    }

    // Exclude from forge coverage
    function test() public {}
}
