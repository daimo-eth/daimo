// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

contract TestLocalScript is Script {
    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function run() public view {
        address nalin = 0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB;
        bytes32 nalinBytes = _addressToBytes32(nalin);

        console2.log("nalinBytes");
        console2.logBytes32(nalinBytes);
    }

    // Exclude from forge coverage
    function test() public {}
}
