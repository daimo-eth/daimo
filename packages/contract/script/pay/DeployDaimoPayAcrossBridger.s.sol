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
            chainIds = new uint256[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
        } else if (block.chainid == BASE_MAINNET) {
            chainIds = new uint256[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
        } else if (block.chainid == ETH_MAINNET) {
            chainIds = new uint256[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
        } else if (block.chainid == LINEA_MAINNET) {
            chainIds = new uint256[](5);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](5);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = OP_MAINNET;
            chainIds[4] = POLYGON_MAINNET;

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
        } else if (block.chainid == OP_MAINNET) {
            chainIds = new uint256[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
            });
        } else if (block.chainid == POLYGON_MAINNET) {
            chainIds = new uint256[](1);
            bridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](1);

            chainIds[0] = LINEA_MAINNET;

            bridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
                bridgeTokenIn: _getUSDCAddress(block.chainid),
                bridgeTokenOut: LINEA_MAINNET_BRIDGED_USDC,
                pctFee: 720000000000000, // 0.072%
                flatFee: 180000 // 0.18 USDC
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
