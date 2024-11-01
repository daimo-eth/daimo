// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayAxelarBridger.sol";
import "../Constants.s.sol";

contract DeployDaimoPayAxelarBridger is Script {
    function run() public {
        address axelarGateway = _getAxelarGatewayAddress(block.chainid);
        address axelarGasService = _getAxelarGasServiceAddress(block.chainid);

        (
            uint256[] memory chainIds,
            DaimoPayAxelarBridger.AxelarBridgeRoute[] memory bridgeRoutes
        ) = _getBridgeRoutes();

        vm.startBroadcast();

        address initOwner = msg.sender;

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayAxelarBridger-options1"),
            abi.encodePacked(
                type(DaimoPayAxelarBridger).creationCode,
                abi.encode(
                    initOwner,
                    IAxelarGatewayWithToken(axelarGateway),
                    IAxelarGasService(axelarGasService),
                    chainIds,
                    bridgeRoutes
                )
            )
        );

        console.log("Axelar bridger deployed at address:", address(bridger));

        vm.stopBroadcast();
    }

    function _getBridgeRoutes()
        private
        view
        returns (
            uint256[] memory chainIds,
            DaimoPayAxelarBridger.AxelarBridgeRoute[] memory bridgeRoutes
        )
    {
        // The bridge always gets sent to the DaimoPayAxelarBridger on the
        // destination chain.
        address axelarReceiver = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayAxelarBridger-options1")
        );

        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // Bridging not supported on testnet.
            return (
                new uint256[](0),
                new DaimoPayAxelarBridger.AxelarBridgeRoute[](0)
            );
        }

        if (
            block.chainid == ARBITRUM_MAINNET ||
            block.chainid == BASE_MAINNET ||
            block.chainid == LINEA_MAINNET ||
            block.chainid == OP_MAINNET ||
            block.chainid == POLYGON_MAINNET
        ) {
            chainIds = new uint256[](1);
            bridgeRoutes = new DaimoPayAxelarBridger.AxelarBridgeRoute[](1);

            chainIds[0] = BSC_MAINNET;

            for (uint32 i = 0; i < chainIds.length; ++i) {
                uint256 fee = block.chainid == POLYGON_MAINNET
                    ? 3000000000000000000 // 3.0 POLYGON
                    : 300000000000000; // 0.0003 ETH

                bridgeRoutes[i] = DaimoPayAxelarBridger.AxelarBridgeRoute({
                    destChainName: _getAxelarChainName(chainIds[i]),
                    bridgeTokenIn: _getAxlUSDCAddress(block.chainid),
                    bridgeTokenOut: _getAxlUSDCAddress(chainIds[i]),
                    bridgeTokenOutSymbol: "axlUSDC",
                    receiverContract: axelarReceiver,
                    fee: fee
                });
            }
        } else if (block.chainid == BSC_MAINNET) {
            chainIds = new uint256[](6);
            bridgeRoutes = new DaimoPayAxelarBridger.AxelarBridgeRoute[](6);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = LINEA_MAINNET;
            chainIds[4] = OP_MAINNET;
            chainIds[5] = POLYGON_MAINNET;

            for (uint32 i = 0; i < chainIds.length; ++i) {
                bridgeRoutes[i] = DaimoPayAxelarBridger.AxelarBridgeRoute({
                    destChainName: _getAxelarChainName(chainIds[i]),
                    bridgeTokenIn: _getAxlUSDCAddress(block.chainid),
                    bridgeTokenOut: _getAxlUSDCAddress(chainIds[i]),
                    bridgeTokenOutSymbol: "axlUSDC",
                    receiverContract: axelarReceiver,
                    fee: 2_000_000_000_000_000 // 2 * 10^15 = 0.002 BNB
                });
            }
        } else {
            revert("Unsupported chainID");
        }

        for (uint32 i = 0; i < chainIds.length; ++i) {
            console.log("toChain:", chainIds[i]);
            console.log("destChainName:", bridgeRoutes[i].destChainName);
            console.log("bridgeTokenIn:", bridgeRoutes[i].bridgeTokenIn);
            console.log("bridgeTokenOut:", bridgeRoutes[i].bridgeTokenOut);
            console.log(
                "bridgeTokenOutSymbol:",
                bridgeRoutes[i].bridgeTokenOutSymbol
            );
            console.log("receiverContract:", bridgeRoutes[i].receiverContract);
            console.log("fee:", bridgeRoutes[i].fee);
            console.log("--------------------------------");
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
