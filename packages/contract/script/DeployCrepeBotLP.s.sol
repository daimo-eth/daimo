// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/CrepeBotLP.sol";
import "./Constants.s.sol";

contract DeployCrepeBotLP is Script {
    function run() public {
        address owner = msg.sender;
        IERC20 usdc = IERC20(_getUSDCAddress(block.chainid));

        vm.startBroadcast();

        address crepeBotLP = CREATE3.deploy(
            keccak256("CrepeBotLP-testing-1"),
            abi.encodePacked(
                type(CrepeBotLP).creationCode,
                abi.encode(owner, usdc)
            )
        );

        console.log("crepeBotLP deployed at address:", crepeBotLP);

        vm.stopBroadcast();
    }
}
