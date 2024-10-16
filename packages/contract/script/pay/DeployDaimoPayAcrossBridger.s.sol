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
            DaimoPayAcrossBridger.AcrossBridgeRoute[] memory bridgeRoutes
        ) = _getBridgeRoutes();

        vm.startBroadcast();

        address initOwner = msg.sender;

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayAcrossBridger-test2"),
            abi.encodePacked(
                type(DaimoPayAcrossBridger).creationCode,
                abi.encode(
                    initOwner,
                    V3SpokePoolInterface(spokePool),
                    chainIds,
                    toTokens,
                    bridgeRoutes
                )
            )
        );

        console.log("Across bridger deployed at address:", address(bridger));

        vm.stopBroadcast();
    }

    function _getBridgeRoutes()
        private
        view
        returns (
            uint256[] memory chainIds,
            address[] memory toTokens,
            DaimoPayAcrossBridger.AcrossBridgeRoute[] memory bridgeRoutes
        )
    {
        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // TODO: add testnet tokens
            revert("Testnet not supported");
        }

        // Each bridge route maps a destination chains token to a local token
        // and specifies a percentage fee and a flat fee for the bridge. The flat
        // fee is calculated as the absolute fee to send 400 USDC. The pct fee
        // is calculated as the pct fee to send 200 USDC.
        // Run the apps/pay-scratchpad/src/acrossFees.ts script to calculate the
        // fees for each chain.
        if (block.chainid == ARBITRUM_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

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

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: ARBITRUM_MAINNET_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });

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
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

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

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: BASE_MAINNET_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });

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
            revert("Unsupported chainID");
        } else if (block.chainid == ETH_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

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

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: ETH_MAINNET_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });

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
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](5);

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

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 420000000000000, // 0.042%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 190000000000000, // 0.019%
                flatFee: 80000 // 0.08 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 48000000000000000, // 4.8%
                flatFee: 9500000 // 9.5 USDC
            });
            bridgeRoutes[3] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 770000000000000, // 0.077%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[4] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 240000000000000, // 0.024%
                flatFee: 90000 // 0.09 USDC
            });
        } else if (block.chainid == LISK_MAINNET) {
            // TODO
            revert("Unsupported chainID");
        } else if (block.chainid == MODE_MAINNET) {
            // TODO
            revert("Unsupported chainID");
        } else if (block.chainid == OP_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: OP_MAINNET_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
        } else if (block.chainid == POLYGON_MAINNET) {
            chainIds = new uint256[](1);
            toTokens = new address[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            toTokens[0] = LINEA_MAINNET_BRIDGED_USDC;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: POLYGON_MAINNET_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
        } else if (block.chainid == REDSTONE_MAINNET) {
            // TODO
            revert("Unsupported chainID");
        } else if (block.chainid == SCROLL_MAINNET) {
            // TODO
            revert("Unsupported chainID");
        } else if (block.chainid == ZORA_MAINNET) {
            // TODO
            revert("Unsupported chainID");
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
