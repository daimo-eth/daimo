// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayAxelarReceiver.sol";
import "../Constants.s.sol";

contract DeployDaimoPayAxelarReceiver is Script {
    function run() public {
        address axelarGateway = _getAxelarGatewayAddress(block.chainid);

        vm.startBroadcast();

        address receiver = CREATE3.deploy(
            keccak256("DaimoPayAxelarReceiver-test3"),
            abi.encodePacked(
                type(DaimoPayAxelarReceiver).creationCode,
                abi.encode(axelarGateway)
            )
        );

        console.log("Axelar receiver deployed at address:", address(receiver));

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
