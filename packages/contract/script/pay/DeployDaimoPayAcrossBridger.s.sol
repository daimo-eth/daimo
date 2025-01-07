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
            DaimoPayAcrossBridger.AcrossBridgeRoute[] memory bridgeRoutes
        ) = _getBridgeRoutes();

        vm.startBroadcast();

        address initOwner = msg.sender;

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayAcrossBridger-options4"),
            abi.encodePacked(
                type(DaimoPayAcrossBridger).creationCode,
                abi.encode(
                    initOwner,
                    V3SpokePoolInterface(spokePool),
                    chainIds,
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
            DaimoPayAcrossBridger.AcrossBridgeRoute[] memory bridgeRoutes
        )
    {
        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // Bridging not supported on testnet.
            return (
                new uint256[](0),
                new DaimoPayAcrossBridger.AcrossBridgeRoute[](0)
            );
        }

        // Each bridge route maps a destination chains token to a local token
        // and specifies a percentage fee and a flat fee for the bridge. The flat
        // fee is calculated as the absolute fee to send 400 USDC. The pct fee
        // is calculated as the pct fee to send 200 USDC.
        // Run the apps/pay-scratchpad/src/acrossFees.ts script to calculate the
        // fees for each chain.
        if (block.chainid == ARBITRUM_MAINNET) {
            chainIds = new uint256[](3);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](3);

            chainIds[0] = LINEA_MAINNET;
            chainIds[1] = WORLDCHAIN_MAINNET;
            chainIds[2] = BLAST_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                pctFee: 300000000000000, // 0.03%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getDAIAddress(block.chainid),
                bridgeTokenOut: BLAST_MAINNET_USDB,
                pctFee: 900000000000000, // 0.09%
                flatFee: 270000000000000000 // 0.27 DAI
            });
        } else if (block.chainid == BASE_MAINNET) {
            chainIds = new uint256[](3);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](3);

            chainIds[0] = LINEA_MAINNET;
            chainIds[1] = WORLDCHAIN_MAINNET;
            chainIds[2] = BLAST_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                pctFee: 300000000000000, // 0.03%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getDAIAddress(block.chainid),
                bridgeTokenOut: BLAST_MAINNET_USDB,
                pctFee: 900000000000000, // 0.09%
                flatFee: 270000000000000000 // 0.27 DAI
            });
        } else if (block.chainid == ETH_MAINNET) {
            chainIds = new uint256[](3);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](3);

            chainIds[0] = LINEA_MAINNET;
            chainIds[1] = WORLDCHAIN_MAINNET;
            chainIds[2] = BLAST_MAINNET;
            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                pctFee: 120000000000000, // 0.012%
                flatFee: 43000 // 0.043 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getDAIAddress(block.chainid),
                bridgeTokenOut: BLAST_MAINNET_USDB,
                pctFee: 500000000000000, // 0.05%
                flatFee: 120000000000000000 // 0.12 DAI
            });
        } else if (block.chainid == LINEA_MAINNET) {
            chainIds = new uint256[](7);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](7);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = OP_MAINNET;
            chainIds[4] = POLYGON_MAINNET;
            chainIds[5] = WORLDCHAIN_MAINNET;
            chainIds[6] = BLAST_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: LINEA_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: _getUSDCAddress(chainIds[0]),
                pctFee: 420000000000000, // 0.042%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: LINEA_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: _getUSDCAddress(chainIds[1]),
                pctFee: 190000000000000, // 0.019%
                flatFee: 80000 // 0.08 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: LINEA_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: _getUSDCAddress(chainIds[2]),
                pctFee: 48000000000000000, // 4.8%
                flatFee: 9500000 // 9.5 USDC
            });
            bridgeRoutes[3] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: LINEA_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: _getUSDCAddress(chainIds[3]),
                pctFee: 770000000000000, // 0.077%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[4] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: LINEA_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: _getUSDCAddress(chainIds[4]),
                pctFee: 240000000000000, // 0.024%
                flatFee: 90000 // 0.09 USDC
            });
            bridgeRoutes[5] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: LINEA_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                pctFee: 300000000000000, // 0.03%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[6] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getDAIAddress(block.chainid),
                bridgeTokenOut: BLAST_MAINNET_USDB,
                pctFee: 900000000000000, // 0.09%
                flatFee: 270000000000000000 // 0.27 DAI
            });
        } else if (block.chainid == OP_MAINNET) {
            chainIds = new uint256[](3);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](3);

            chainIds[0] = LINEA_MAINNET;
            chainIds[1] = WORLDCHAIN_MAINNET;
            chainIds[2] = BLAST_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                pctFee: 300000000000000, // 0.03%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getDAIAddress(block.chainid),
                bridgeTokenOut: BLAST_MAINNET_USDB,
                pctFee: 900000000000000, // 0.09%
                flatFee: 270000000000000000 // 0.27 DAI
            });
        } else if (block.chainid == POLYGON_MAINNET) {
            chainIds = new uint256[](3);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](3);

            chainIds[0] = LINEA_MAINNET;
            chainIds[1] = WORLDCHAIN_MAINNET;
            chainIds[2] = BLAST_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                pctFee: 300000000000000, // 0.03%
                flatFee: 120000 // 0.12 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getDAIAddress(block.chainid),
                bridgeTokenOut: BLAST_MAINNET_USDB,
                pctFee: 900000000000000, // 0.09%
                flatFee: 270000000000000000 // 0.27 DAI
            });
        } else if (block.chainid == WORLDCHAIN_MAINNET) {
            chainIds = new uint256[](6);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](6);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = LINEA_MAINNET;
            chainIds[4] = OP_MAINNET;
            chainIds[5] = POLYGON_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: ARBITRUM_MAINNET_USDC,
                pctFee: 440000000000000, // 0.044%
                flatFee: 170000 // 0.17 USDC
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: BASE_MAINNET_USDC,
                pctFee: 440000000000000, // 0.044%
                flatFee: 170000 // 0.17 USDC
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: ETH_MAINNET_USDC,
                pctFee: 14600000000000000, // 1.46%
                flatFee: 3000000 // 3.0 USDC
            });
            bridgeRoutes[3] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 690000000000000, // 0.069%
                flatFee: 210000 // 0.21 USDC
            });
            bridgeRoutes[4] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: OP_MAINNET_USDC,
                pctFee: 390000000000000, // 0.039%
                flatFee: 160000 // 0.16 USDC
            });
            bridgeRoutes[5] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: WORLDCHAIN_MAINNET_BRIDGED_USDC,
                bridgeTokenOut: POLYGON_MAINNET_USDC,
                pctFee: 440000000000000, // 0.044%
                flatFee: 170000 // 0.17 USDC
            });
        } else if (block.chainid == BLAST_MAINNET) {
            chainIds = new uint256[](6);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](6);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = LINEA_MAINNET;
            chainIds[4] = OP_MAINNET;
            chainIds[5] = POLYGON_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: BLAST_MAINNET_USDB,
                bridgeTokenOut: _getDAIAddress(ARBITRUM_MAINNET),
                pctFee: 1800000000000000, // 0.18%
                flatFee: 570000000000000000 // 0.57 USDB
            });
            bridgeRoutes[1] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: BLAST_MAINNET_USDB,
                bridgeTokenOut: _getDAIAddress(BASE_MAINNET),
                pctFee: 1600000000000000, // 0.16%
                flatFee: 530000000000000000 // 0.53 USDB
            });
            bridgeRoutes[2] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: BLAST_MAINNET_USDB,
                bridgeTokenOut: _getDAIAddress(ETH_MAINNET),
                pctFee: 33400000000000000, // 3.34%
                flatFee: 6890000000000000000 // 6.89 USDB
            });
            bridgeRoutes[3] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: BLAST_MAINNET_USDB,
                bridgeTokenOut: _getDAIAddress(LINEA_MAINNET),
                pctFee: 2600000000000000, // 0.26%
                flatFee: 740000000000000000 // 0.74 USDB
            });
            bridgeRoutes[4] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: BLAST_MAINNET_USDB,
                bridgeTokenOut: _getDAIAddress(OP_MAINNET),
                pctFee: 1400000000000000, // 0.14%
                flatFee: 490000000000000000 // 0.49 USDB
            });
            bridgeRoutes[5] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: BLAST_MAINNET_USDB,
                bridgeTokenOut: _getDAIAddress(POLYGON_MAINNET),
                pctFee: 1200000000000000, // 0.12%
                flatFee: 450000000000000000 // 0.45 USDB
            });
        } else {
            revert("Unsupported chainID");
        }

        for (uint256 i = 0; i < chainIds.length; ++i) {
            console.log("toChain:", chainIds[i]);
            console.log("bridgeTokenIn:", bridgeRoutes[i].bridgeTokenIn);
            console.log("bridgeTokenOut:", bridgeRoutes[i].bridgeTokenOut);
            console.log("pctFee:", bridgeRoutes[i].pctFee);
            console.log("flatFee:", bridgeRoutes[i].flatFee);
            console.log("--------------------------------");
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
