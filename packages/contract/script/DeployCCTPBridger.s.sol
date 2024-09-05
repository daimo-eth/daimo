// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/DaimoCCTPBridger.sol";
import "./Constants.s.sol";

contract DeployCCTPBridgerScript is Script {
    function run() public {
        address tokenMessenger = _getTokenMessengerAddress(block.chainid);

        (
            uint256[] memory chainIDs,
            uint32[] memory domains,
            address[] memory tokens
        ) = _getChains();

        address fastCCTP = 0x92275f59CEB72DD132de54F726f767ab6ba9559f;

        vm.startBroadcast();

        DaimoCCTPBridger implementation = new DaimoCCTPBridger{salt: 0}();

        // initOwner = daimo.eth
        address initOwner = 0xEEee8B1371f1664b7C2A8c111D6062b6576fA6f0;

        address bridger = CREATE3.deploy(
            keccak256("DaimoCCTPBridger-9"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(implementation),
                    abi.encodeWithSelector(
                        DaimoCCTPBridger.init.selector,
                        initOwner,
                        tokenMessenger,
                        fastCCTP,
                        chainIDs,
                        domains,
                        tokens
                    )
                )
            )
        );
        console.log("bridger deployed at address:", address(bridger));

        vm.stopBroadcast();
    }

    function _getChains()
        private
        view
        returns (
            uint256[] memory chainIDs,
            uint32[] memory domains,
            address[] memory tokens
        )
    {
        bool testnet = _isTestnet(block.chainid);

        chainIDs = new uint256[](6);
        chainIDs[0] = testnet ? ETH_TESTNET : ETH_MAINNET;
        chainIDs[1] = testnet ? AVAX_TESTNET : AVAX_MAINNET;
        chainIDs[2] = testnet ? OP_TESTNET : OP_MAINNET;
        chainIDs[3] = testnet ? ARBITRUM_TESTNET : ARBITRUM_MAINNET;
        chainIDs[4] = testnet ? BASE_TESTNET : BASE_MAINNET;
        chainIDs[5] = testnet ? POLYGON_TESTNET : POLYGON_MAINNET;

        domains = new uint32[](6);
        domains[0] = ETH_DOMAIN;
        domains[1] = AVAX_DOMAIN;
        domains[2] = OP_DOMAIN;
        domains[3] = ARBITRUM_DOMAIN;
        domains[4] = BASE_DOMAIN;
        domains[5] = POLYGON_DOMAIN;

        tokens = new address[](6);
        tokens[0] = _getUSDCAddress(chainIDs[0]);
        tokens[1] = _getUSDCAddress(chainIDs[1]);
        tokens[2] = _getUSDCAddress(chainIDs[2]);
        tokens[3] = _getUSDCAddress(chainIDs[3]);
        tokens[4] = _getUSDCAddress(chainIDs[4]);
        tokens[5] = _getUSDCAddress(chainIDs[5]);
    }

    // Exclude from forge coverage
    function test() public {}
}
