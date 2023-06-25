// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";
import "../src/TestUSDC.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
        IEntryPoint entryPoint = IEntryPoint(
            0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
        );

        P256SHA256 verifier = P256SHA256(
            0x026CC12c4a97608EF025F36b427864F2F5be851A // From DeployP256SHA256
        );

        AccountFactory factory = new AccountFactory{salt: 0}(
            entryPoint,
            verifier
        );
        console.log("factory address:", address(factory));

        vm.stopBroadcast();
    }
}
