// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/AccountFactory.sol";

contract TestExecuteScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        Account newAcc = Account(payable(0x86177d751ec9b26AEf886C7612Dcfa123214b366)); // From NewAccount.s.sol
        console.log("new account address:", address(newAcc));
        bytes memory data = hex"00";
        newAcc.execute(0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB, 0.01 ether, data);

        vm.stopBroadcast();
    }
}
