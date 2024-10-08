// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/pay/DaimoPayBridger.sol";
import "../Constants.s.sol";

contract DeployDaimoPayBridger is Script {
    function run() public {
        vm.startBroadcast();

        // initOwner = daimo.eth
        address initOwner = 0xEEee8B1371f1664b7C2A8c111D6062b6576fA6f0;

        DaimoPayBridger implementation = new DaimoPayBridger{salt: 0}(
            initOwner
        );

        (
            uint256[] memory chainIds,
            address[] memory bridgers
        ) = _getBridgersAndChainIds();

        address bridger = CREATE3.deploy(
            keccak256("DaimoPayBridger-test1"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(implementation),
                    abi.encodeWithSelector(
                        DaimoPayBridger.init.selector,
                        chainIds,
                        bridgers
                    )
                )
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

        address cctpBridger = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayCCTPBridger-test1")
        );
        address acrossBridger = CREATE3.getDeployed(
            msg.sender,
            keccak256("DaimoPayAcrossBridger-test1")
        );

        if (testnet) {
            // TODO
            return (chainIds, bridgers);
        } else {
            chainIds = new uint256[](7);
            bridgers = new address[](7);

            // Linea is the only chain which uses Across
            // All other chains use CCTP

            chainIds[0] = ARBITRUM_MAINNET;
            chainIds[1] = AVAX_MAINNET;
            chainIds[2] = BASE_MAINNET;
            chainIds[3] = ETH_MAINNET;
            chainIds[4] = OP_MAINNET;
            chainIds[5] = POLYGON_MAINNET;
            chainIds[6] = LINEA_MAINNET;

            bridgers[0] = cctpBridger;
            bridgers[1] = cctpBridger;
            bridgers[2] = cctpBridger;
            bridgers[3] = cctpBridger;
            bridgers[4] = cctpBridger;
            bridgers[5] = cctpBridger;
            bridgers[6] = acrossBridger;

            return (chainIds, bridgers);
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
