// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayCCTPBridger.sol";
import "../Constants.s.sol";

contract DeployDaimoPayCCTPBridger is Script {
    function run() public {
        address tokenMinter = _getTokenMinterAddress(block.chainid);
        address tokenMessenger = _getTokenMessengerAddress(block.chainid);

        (uint256[] memory chainIds, uint32[] memory domains) = _getCCTPChains();

        vm.startBroadcast();

        address initOwner = msg.sender;

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayCCTPBridger-test5"),
            abi.encodePacked(
                type(DaimoPayCCTPBridger).creationCode,
                abi.encode(
                    initOwner,
                    ITokenMinter(tokenMinter),
                    ICCTPTokenMessenger(tokenMessenger),
                    chainIds,
                    domains
                )
            )
        );
        console.log("CCTP bridger deployed at address:", address(bridger));

        vm.stopBroadcast();
    }

    function _getCCTPChains()
        private
        view
        returns (uint256[] memory chainIds, uint32[] memory domains)
    {
        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // Bridging not supported on testnet.
            return (new uint256[](0), new uint32[](0));
        }

        chainIds = new uint256[](6);
        chainIds[0] = testnet ? ETH_TESTNET : ETH_MAINNET;
        chainIds[1] = testnet ? AVAX_TESTNET : AVAX_MAINNET;
        chainIds[2] = testnet ? OP_TESTNET : OP_MAINNET;
        chainIds[3] = testnet ? ARBITRUM_TESTNET : ARBITRUM_MAINNET;
        chainIds[4] = testnet ? BASE_TESTNET : BASE_MAINNET;
        chainIds[5] = testnet ? POLYGON_TESTNET : POLYGON_MAINNET;

        domains = new uint32[](6);
        domains[0] = ETH_DOMAIN;
        domains[1] = AVAX_DOMAIN;
        domains[2] = OP_DOMAIN;
        domains[3] = ARBITRUM_DOMAIN;
        domains[4] = BASE_DOMAIN;
        domains[5] = POLYGON_DOMAIN;

        return (chainIds, domains);
    }

    // Exclude from forge coverage
    function test() public {}
}
