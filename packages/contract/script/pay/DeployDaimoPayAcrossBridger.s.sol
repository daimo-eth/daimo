// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayAcrossBridger.sol";
import "../Constants.s.sol";

contract DeployDaimoPayAcrossBridger is Script {
    function run() public {
        address spokePool = _getSpokePoolAddress(block.chainid);

        (
            uint256[] memory chainIds,
            address[] memory toTokens,
            address[] memory localTokens
        ) = _getChains();

        vm.startBroadcast();

        // initOwner = daimo.eth
        address initOwner = 0xEEee8B1371f1664b7C2A8c111D6062b6576fA6f0;

        DaimoPayAcrossBridger implementation = new DaimoPayAcrossBridger{
            salt: 0
        }(
            initOwner,
            V3SpokePoolInterface(spokePool),
            1e16 // 1% fee
        );

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayAcrossBridger-test1"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(implementation),
                    abi.encodeWithSelector(
                        DaimoPayAcrossBridger.init.selector,
                        chainIds,
                        toTokens,
                        localTokens
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
            uint256[] memory chainIds,
            address[] memory toTokens,
            address[] memory localTokens
        )
    {
        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // TODO: add testnet tokens
            return (new uint256[](0), new address[](0), new address[](0));
        }

        if (block.chainid == ARBITRUM_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            localTokens = new address[](1);

            // chainIds[0] = BASE_MAINNET;
            // chainIds[1] = BLAST_MAINNET;
            // chainIds[2] = ETH_MAINNET;
            chainIds[0] = LINEA_MAINNET;
            // chainIds[4] = LISK_MAINNET;
            // chainIds[5] = MODE_MAINNET;
            // chainIds[6] = OP_MAINNET;
            // chainIds[7] = POLYGON_MAINNET;
            // chainIds[8] = REDSTONE_MAINNET;
            // chainIds[9] = SCROLL_MAINNET;
            // chainIds[10] = ZKSYNC_MAINNET;
            // chainIds[11] = ZORA_MAINNET;

            // toTokens[0] = BASE_MAINNET_USDC;
            // toTokens[1] = BLAST_MAINNET_USDB;
            // toTokens[2] = ETH_MAINNET_USDC;
            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;
            // toTokens[4] = LISK_MAINNET_USDT;
            // toTokens[5] = MODE_MAINNET_BRIDGED_USDC;
            // toTokens[6] = OP_MAINNET_USDC;
            // toTokens[7] = POLYGON_MAINNET_USDC;
            // toTokens[8] = OP_STACK_WETH;
            // toTokens[9] = SCROLL_MAINNET_USDC;
            // toTokens[10] = ZKSYNC_MAINNET_BRIDGED_USDC;
            // toTokens[11] = ZORA_MAINNET_USDzC;

            localTokens[0] = ARBITRUM_MAINNET_USDC;
            // localTokens[1] = ARBITRUM_MAINNET_DAI;
            // localTokens[2] = ARBITRUM_MAINNET_USDC;
            // localTokens[3] = ARBITRUM_MAINNET_USDC;
            // localTokens[4] = ARBITRUM_MAINNET_USDT;
            // localTokens[5] = ARBITRUM_MAINNET_USDC;
            // localTokens[6] = ARBITRUM_MAINNET_USDC;
            // localTokens[7] = ARBITRUM_MAINNET_USDC;
            // localTokens[8] = ARBITRUM_MAINNET_WETH;
            // localTokens[9] = ARBITRUM_MAINNET_USDC;
            // localTokens[10] = ARBITRUM_MAINNET_USDC;
            // localTokens[11] = ARBITRUM_MAINNET_USDC;
        } else if (block.chainid == BASE_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            localTokens = new address[](1);

            // chainIds[0] = ARBITRUM_MAINNET;
            // chainIds[1] = BLAST_MAINNET;
            // chainIds[2] = ETH_MAINNET;
            chainIds[0] = LINEA_MAINNET;
            // chainIds[4] = LISK_MAINNET;
            // chainIds[5] = MODE_MAINNET;
            // chainIds[6] = OP_MAINNET;
            // chainIds[7] = POLYGON_MAINNET;
            // chainIds[8] = REDSTONE_MAINNET;
            // chainIds[9] = SCROLL_MAINNET;
            // chainIds[10] = ZKSYNC_MAINNET;
            // chainIds[11] = ZORA_MAINNET;

            // toTokens[0] = ARBITRUM_MAINNET_USDC;
            // toTokens[1] = BLAST_MAINNET_USDB;
            // toTokens[2] = ETH_MAINNET_USDC;
            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;
            // toTokens[4] = OP_STACK_WETH;
            // toTokens[5] = MODE_MAINNET_BRIDGED_USDC;
            // toTokens[6] = OP_MAINNET_USDC;
            // toTokens[7] = POLYGON_MAINNET_USDC;
            // toTokens[8] = OP_STACK_WETH;
            // toTokens[9] = SCROLL_MAINNET_USDC;
            // toTokens[10] = ZKSYNC_MAINNET_BRIDGED_USDC;
            // toTokens[11] = ZORA_MAINNET_USDzC;

            localTokens[0] = BASE_MAINNET_USDC;
            // localTokens[1] = BASE_MAINNET_DAI;
            // localTokens[2] = BASE_MAINNET_USDC;
            // localTokens[3] = BASE_MAINNET_USDC;
            // localTokens[4] = OP_STACK_WETH;
            // localTokens[5] = BASE_MAINNET_USDC;
            // localTokens[6] = BASE_MAINNET_USDC;
            // localTokens[7] = BASE_MAINNET_USDC;
            // localTokens[8] = OP_STACK_WETH;
            // localTokens[9] = BASE_MAINNET_USDC;
            // localTokens[10] = BASE_MAINNET_USDC;
            // localTokens[11] = BASE_MAINNET_USDC;
        } else if (block.chainid == BLAST_MAINNET) {
            // TODO
        } else if (block.chainid == ETH_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            localTokens = new address[](1);

            // chainIds[0] = ARBITRUM_MAINNET;
            // chainIds[1] = BASE_MAINNET;
            // chainIds[2] = BLAST_MAINNET;
            chainIds[0] = LINEA_MAINNET;
            // chainIds[4] = LISK_MAINNET;
            // chainIds[5] = MODE_MAINNET;
            // chainIds[6] = OP_MAINNET;
            // chainIds[7] = POLYGON_MAINNET;
            // chainIds[8] = REDSTONE_MAINNET;
            // chainIds[9] = SCROLL_MAINNET;
            // chainIds[10] = ZKSYNC_MAINNET;
            // chainIds[11] = ZORA_MAINNET;

            // toTokens[0] = ARBITRUM_MAINNET_USDC;
            // toTokens[1] = BASE_MAINNET_USDC;
            // toTokens[2] = BLAST_MAINNET_USDB;
            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;
            // toTokens[4] = LISK_MAINNET_USDT;
            // toTokens[5] = MODE_MAINNET_BRIDGED_USDC;
            // toTokens[6] = OP_MAINNET_USDC;
            // toTokens[7] = POLYGON_MAINNET_USDC;
            // toTokens[8] = OP_STACK_WETH;
            // toTokens[9] = SCROLL_MAINNET_USDC;
            // toTokens[10] = ZKSYNC_MAINNET_BRIDGED_USDC;
            // toTokens[11] = ZORA_MAINNET_USDzC;

            localTokens[0] = ETH_MAINNET_USDC;
            // localTokens[1] = ETH_MAINNET_USDC;
            // localTokens[2] = ETH_MAINNET_DAI;
            // localTokens[3] = ETH_MAINNET_USDC;
            // localTokens[4] = ETH_MAINNET_USDC;
            // localTokens[5] = ETH_MAINNET_USDC;
            // localTokens[6] = ETH_MAINNET_USDC;
            // localTokens[7] = ETH_MAINNET_USDC;
            // localTokens[8] = ETH_MAINNET_WETH;
            // localTokens[9] = ETH_MAINNET_USDC;
            // localTokens[10] = ETH_MAINNET_USDC;
            // localTokens[11] = ETH_MAINNET_USDC;
        } else if (block.chainid == LINEA_MAINNET) {
            chainIds = new uint256[](5);
            toTokens = new address[](5);
            localTokens = new address[](5);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = OP_MAINNET;
            chainIds[4] = POLYGON_MAINNET;

            toTokens[0] = ARBITRUM_MAINNET_USDC;
            toTokens[1] = BASE_MAINNET_USDC;
            toTokens[2] = ETH_MAINNET_USDC;
            toTokens[3] = OP_MAINNET_USDC;
            toTokens[4] = POLYGON_MAINNET_USDC;

            localTokens[0] = LINEA_MAINNET_BRIDGED_USDC;
            localTokens[1] = LINEA_MAINNET_BRIDGED_USDC;
            localTokens[2] = LINEA_MAINNET_BRIDGED_USDC;
            localTokens[3] = LINEA_MAINNET_BRIDGED_USDC;
            localTokens[4] = LINEA_MAINNET_BRIDGED_USDC;
        } else if (block.chainid == LISK_MAINNET) {
            // TODO
        } else if (block.chainid == MODE_MAINNET) {
            // TODO
        } else if (block.chainid == OP_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            localTokens = new address[](1);

            chainIds[0] = LINEA_MAINNET;

            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;

            localTokens[0] = OP_MAINNET_USDC;
        } else if (block.chainid == POLYGON_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            localTokens = new address[](1);

            chainIds[0] = LINEA_MAINNET;

            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;

            localTokens[0] = POLYGON_MAINNET_USDC;
        } else if (block.chainid == REDSTONE_MAINNET) {
            // TODO
        } else if (block.chainid == SCROLL_MAINNET) {
            // TODO
        } else if (block.chainid == ZKSYNC_MAINNET) {
            // TODO
        } else if (block.chainid == ZORA_MAINNET) {
            // TODO
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
