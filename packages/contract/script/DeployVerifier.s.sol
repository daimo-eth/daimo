// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoVerifier.sol";

contract DeployVerifierScript is Script {
    function run() public {
        vm.startBroadcast();

        // Use CREATE2
        address verifier = address(new DaimoVerifier{salt: 0}());
        new DaimoVerifierProxy{salt: 0}(
            address(verifier), // implementation
            abi.encodeWithSelector(DaimoVerifier.init.selector, hex"")
        );

        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
