// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./Constants.s.sol";

contract DeployTestAccountV2Script is Script {
    function run() public {
        vm.startBroadcast();

        // hardcoded from swift playground
        uint256 k0 = 0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4;
        uint256 k1 = 0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437;
        bytes32[2] memory key = [bytes32(k0), bytes32(k1)];

        // from deployments
        address factory = 0xAC58C46A40ff5c2cb5e1CD40179CEB8E6207BF0B;
        address swapper = 0xB500c071ADcD7bdCC34770958dDB7328F0154869;
        address bridger = 0x9066407f4C4d0c189688cC56eCa8A4a733Febd8D;

        bool testnet = _isTestnet(block.chainid);
        uint256 homeChain = testnet ? BASE_TESTNET : BASE_MAINNET;
        address homeCoin = _getUSDCAddress(homeChain);

        DaimoAccountFactoryV2(factory).createAccount({
            homeChain: homeChain,
            homeCoin: IERC20(homeCoin),
            swapper: IDaimoSwapper(swapper),
            bridger: IDaimoBridger(bridger),
            keySlot: 0,
            key: key,
            salt: 0
        });

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
