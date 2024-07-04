// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./Constants.s.sol";

contract DeployScript is Script {
    function run() public {
        require(block.chainid == BASE_MAINNET || block.chainid == OP_MAINNET);

        vm.startBroadcast();

        // hardcoded from swift playground
        uint256 k0 = 0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4;
        uint256 k1 = 0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437;
        bytes32[2] memory key = [bytes32(k0), bytes32(k1)];

        // from deployments
        address factory = 0x682b862b13d1C208E0A37740525180DD4223e66e;
        address swapper = 0x6C3D6f8be26913bCECBC582e36Ee12451b8c11C8;
        address bridger = 0x360019a39c449e55Ea4053dFc05086C8467F3444;

        uint256 homeChain = BASE_MAINNET;
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
