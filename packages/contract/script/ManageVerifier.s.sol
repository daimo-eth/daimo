// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoPaymaster.sol";
import "openzeppelin-contracts/contracts/utils/Create2.sol";

/// Manager script for DaimoVerifier. Meant for one-time use,
/// get our verifier audited and then upgrade and burn our
/// contract ownership.
contract ManageVerifierScript is Script {
    function deployNewVerifier() public {
        vm.startBroadcast();

        // Use CREATE2
        address verifier = address(new DaimoVerifier{salt: 0}());
        new DaimoVerifierProxy{salt: 0}(
            address(verifier), // implementation
            abi.encodeWithSelector(DaimoVerifier.init.selector, hex"")
        );

        vm.stopBroadcast();
    }

    function upgradeVerifier(bool confirm) public {
        // TODO: double check addresses
        DaimoVerifier currentVerifier = DaimoVerifier(
            0xa7284d3cC7D053fE7388401c1F31311BaEcE1f6e // Proxy address
        );
        address upgradedAddress = address(0);

        console.log("current verifier:", address(currentVerifier));
        console.log("upgraded verifier:", upgradedAddress);
        if (confirm) {
            console.log("Upgrading verifier to", upgradedAddress);
            vm.startBroadcast();
            currentVerifier.upgradeTo(upgradedAddress);
            vm.stopBroadcast();
        }
    }

    function burnOwnership(bool confirm) public {
        // TODO: double check addresses
        DaimoVerifier currentVerifier = DaimoVerifier(
            0xa7284d3cC7D053fE7388401c1F31311BaEcE1f6e // Proxy address
        );

        console.log("current verifier:", address(currentVerifier));
        if (confirm) {
            console.log("Burning ownership");
            vm.startBroadcast();
            currentVerifier.transferOwnership(address(0));
            vm.stopBroadcast();
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
