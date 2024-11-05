// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "../src/TokenBalanceUtils.sol";
import "./Constants.s.sol";

contract DeployTokenBalanceUtils is Script {
    function run() public {
        vm.startBroadcast();

        address owner = tx.origin;
        console.log("owner:", owner);

        address tokenBalanceUtils = CREATE3.deploy(
            keccak256("TokenBalanceUtils-test4"),
            abi.encodePacked(
                type(TokenBalanceUtils).creationCode,
                abi.encode(owner)
            )
        );

        vm.stopBroadcast();

        console.log(
            "token balance utils deployed at address:",
            tokenBalanceUtils
        );
    }

    // Exclude from forge coverage
    function test() public {}
}
