// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "../src/DaimoCCTPBridger.sol";
import "./Constants.s.sol";

contract DeployCCTPBridgerScript is Script {
    function run() public {
        uint256 chainId = block.chainid;
        bool testnet = _isTestnet(chainId);

        uint256[] memory inputChainIds = new uint256[](6);
        inputChainIds[0] = testnet ? ETH_TESTNET : ETH_MAINNET;
        inputChainIds[1] = testnet ? AVAX_TESTNET : AVAX_MAINNET;
        inputChainIds[2] = testnet ? OP_TESTNET : OP_MAINNET;
        inputChainIds[3] = testnet ? ARBITRUM_TESTNET : ARBITRUM_MAINNET;
        inputChainIds[4] = testnet ? BASE_TESTNET : BASE_MAINNET;
        inputChainIds[5] = testnet ? POLYGON_TESTNET : POLYGON_MAINNET;

        uint32[] memory outputDomains = new uint32[](6);
        outputDomains[0] = ETH_DOMAIN;
        outputDomains[1] = AVAX_DOMAIN;
        outputDomains[2] = OP_DOMAIN;
        outputDomains[3] = ARBITRUM_DOMAIN;
        outputDomains[4] = BASE_DOMAIN;
        outputDomains[5] = POLYGON_DOMAIN;

        address tokenMessengerAddress = _getTokenMessengerAddress(chainId);
        ICCTPTokenMessenger tokenMessenger = ICCTPTokenMessenger(
            tokenMessengerAddress
        );

        vm.startBroadcast();

        DaimoCCTPBridger bridger = DaimoCCTPBridger(
            CREATE3.deploy(
                keccak256("DaimoCCTPBridger-2"),
                bytes.concat(
                    type(DaimoCCTPBridger).creationCode,
                    abi.encode(tokenMessenger, inputChainIds, outputDomains)
                )
            )
        );
        console.log("bridger deployed at address:", address(bridger));

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
