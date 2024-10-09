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

        // initOwner = daimo.eth
        address initOwner = 0xEEee8B1371f1664b7C2A8c111D6062b6576fA6f0;

        DaimoPayCCTPBridger implementation = new DaimoPayCCTPBridger{salt: 0}();

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayCCTPBridger-test1"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(implementation),
                    abi.encodeWithSelector(
                        DaimoPayCCTPBridger.init.selector,
                        initOwner,
                        ITokenMinter(tokenMinter),
                        ICCTPTokenMessenger(tokenMessenger),
                        chainIds,
                        domains
                    )
                )
            )
        );
        console.log("bridger deployed at address:", address(bridger));

        vm.stopBroadcast();
    }

    function _getCCTPChains()
        private
        view
        returns (uint256[] memory chainIds, uint32[] memory domains)
    {
        bool testnet = _isTestnet(block.chainid);

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
