// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/P256SHA256.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        P256SHA256 verifier = new P256SHA256{salt: bytes32(uint256(1))}();

        console.log("verifier address:", address(verifier));

        vm.stopBroadcast();
    }
}
