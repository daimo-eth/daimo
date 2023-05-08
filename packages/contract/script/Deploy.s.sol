// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
        IEntryPoint entryPoint = IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

        P256SHA256 verifier = new P256SHA256();
        
        AccountFactory factory = new AccountFactory(entryPoint, verifier);
        console.log("factory address:", address(factory));

        vm.stopBroadcast();
    }
}
