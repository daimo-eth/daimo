// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayBridger.sol";
import "../Constants.s.sol";

contract DeployDaimoPayBridger is Script {
    function run() public {
        vm.startBroadcast();

        address initOwner = msg.sender;

        (
            uint256[] memory chainIds,
            address[] memory bridgers
        ) = _getBridgersAndChainIds();

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayBridger-test2"),
            abi.encodePacked(
                type(DaimoPayBridger).creationCode,
                abi.encode(initOwner, chainIds, bridgers)
            )
        );

        vm.stopBroadcast();

        console.log("bridger deployed at address:", bridger);
    }

    function _getBridgersAndChainIds()
        private
        view
        returns (uint256[] memory chainIds, address[] memory bridgers)
    {
        bool testnet = _isTestnet(block.chainid);
        if (testnet) {
            // TODO
            return (new uint256[](0), new address[](0));
        }

        address acrossBridger = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayAcrossBridger-test2")
        );
        address cctpBridger = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayCCTPBridger-test2")
        );
        console.log("acrossBridger address:", acrossBridger);
        console.log("cctpBridger address:", cctpBridger);

        // Bridge to other chains using CCTP. Only Linea uses Across.
        uint256[] memory allChainIds = new uint256[](7);
        address[] memory allBridgers = new address[](7);

        allChainIds[0] = ARBITRUM_MAINNET;
        allChainIds[1] = AVAX_MAINNET;
        allChainIds[2] = BASE_MAINNET;
        allChainIds[3] = ETH_MAINNET;
        allChainIds[4] = OP_MAINNET;
        allChainIds[5] = POLYGON_MAINNET;
        allChainIds[6] = LINEA_MAINNET;

        allBridgers[0] = cctpBridger;
        allBridgers[1] = cctpBridger;
        allBridgers[2] = cctpBridger;
        allBridgers[3] = cctpBridger;
        allBridgers[4] = cctpBridger;
        allBridgers[5] = cctpBridger;
        allBridgers[6] = acrossBridger;

        chainIds = new uint256[](6);
        bridgers = new address[](6);

        // Include all chainIds except the current chainId
        uint256 count = 0;
        for (uint256 i = 0; i < allChainIds.length; ++i) {
            if (allChainIds[i] != block.chainid) {
                chainIds[count] = allChainIds[i];
                bridgers[count] = allBridgers[i];
                ++count;
            }
        }

        // Linea bridges to other chains using Across. Override the CCTP bridgers.
        if (block.chainid == LINEA_MAINNET) {
            for (uint256 i = 0; i < bridgers.length; ++i) {
                bridgers[i] = acrossBridger;
            }
        }

        for (uint256 i = 0; i < chainIds.length; ++i) {
            console.log("toChain:", chainIds[i], "bridger:", bridgers[i]);
        }

        return (chainIds, bridgers);
    }

    // Exclude from forge coverage
    function test() public {}
}
