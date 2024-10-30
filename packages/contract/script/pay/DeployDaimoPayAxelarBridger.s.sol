// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayAxelarBridger.sol";
import "../../src/pay/DaimoPayAxelarReceiver.sol";
import "../Constants.s.sol";

contract DeployDaimoPayAxelarBridger is Script {
    function run() public {
        address axelarGateway = _getAxelarGatewayAddress(block.chainid);
        address axelarGasService = _getAxelarGasServiceAddress(block.chainid);

        (
            uint256[] memory chainIds,
            address[] memory toTokens,
            DaimoPayAxelarBridger.AxelarBridgeRoute[] memory bridgeRoutes
        ) = _getBridgeRoutes();

        vm.startBroadcast();

        address initOwner = msg.sender;

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayAxelarBridger-test3"),
            abi.encodePacked(
                type(DaimoPayAxelarBridger).creationCode,
                abi.encode(
                    initOwner,
                    IAxelarGatewayWithToken(axelarGateway),
                    IAxelarGasService(axelarGasService),
                    chainIds,
                    toTokens,
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
            address[] memory toTokens,
            DaimoPayAxelarBridger.AxelarBridgeRoute[] memory bridgeRoutes
        )
    {
        address axelarReceiver = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayAxelarReceiver-test3")
        );

        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // Bridging not supported on testnet.
            return (
                new uint256[](0),
                new address[](0),
                new DaimoPayAxelarBridger.AxelarBridgeRoute[](0)
            );
        }

        // Axelar fees are calculated as the sum of the source and destination
        // chain fees.
        if (
            block.chainid == ARBITRUM_MAINNET ||
            block.chainid == BASE_MAINNET ||
            block.chainid == LINEA_MAINNET ||
            block.chainid == OP_MAINNET ||
            block.chainid == POLYGON_MAINNET
        ) {
            chainIds = new uint256[](2);
            toTokens = new address[](2);
            bridgeRoutes = new DaimoPayAxelarBridger.AxelarBridgeRoute[](2);

            chainIds[0] = BNB_MAINNET;
            chainIds[1] = OP_MAINNET;

            for (uint32 i = 0; i < chainIds.length; ++i) {
                toTokens[i] = _getAxlUSDCAddress(chainIds[i]);
                bridgeRoutes[i] = DaimoPayAxelarBridger.AxelarBridgeRoute({
                    destChainName: _getAxelarChainName(chainIds[i]),
                    tokenSymbol: "axlUSDC",
                    localTokenAddr: _getAxlUSDCAddress(block.chainid),
                    receiverContract: axelarReceiver,
                    fee: 1_000_000 // 1 USDC
                });
            }
        } else if (block.chainid == BNB_MAINNET) {
            chainIds = new uint256[](6);
            toTokens = new address[](6);
            bridgeRoutes = new DaimoPayAxelarBridger.AxelarBridgeRoute[](6);

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = BASE_MAINNET;
            chainIds[2] = ETH_MAINNET;
            chainIds[3] = LINEA_MAINNET;
            chainIds[4] = OP_MAINNET;
            chainIds[5] = POLYGON_MAINNET;

            for (uint32 i = 0; i < chainIds.length; ++i) {
                toTokens[i] = _getAxlUSDCAddress(chainIds[i]);
                bridgeRoutes[i] = DaimoPayAxelarBridger.AxelarBridgeRoute({
                    destChainName: _getAxelarChainName(chainIds[i]),
                    tokenSymbol: "axlUSDC",
                    localTokenAddr: _getAxlUSDCAddress(block.chainid),
                    receiverContract: axelarReceiver,
                    fee: 1_000_000 // 1 USDC
                });
            }
        } else {
            revert("Unsupported chainID");
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
