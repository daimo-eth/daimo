// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoPaymasterV2.sol";
import "openzeppelin-contracts/contracts/utils/Create2.sol";

contract DeployPaymasterScript is Script {
    // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
    IEntryPoint public entryPoint =
        IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    // Base USDC MetaPaymaster
    IMetaPaymaster public metaPaymaster =
        IMetaPaymaster(0x75B9328BB753144705b77b215E304eC7ef45235C);

    function deploy() public {
        vm.startBroadcast();

        // Use CREATE2
        new DaimoPaymasterV2{salt: 0}(entryPoint, msg.sender, metaPaymaster);

        vm.stopBroadcast();
    }

    function start(DaimoPaymasterV2 paymaster) public payable {
        // deposit for paymaster
        addDeposit(paymaster);

        // whitelist destinations for paymaster
        whitelistBundler(paymaster);
    }

    function addDeposit(DaimoPaymasterV2 paymaster) public payable {
        console.log("previous deposit:", paymaster.getDeposit());

        vm.startBroadcast();
        paymaster.deposit{value: 0.005 ether}();
        vm.stopBroadcast();

        console.log("new deposit:", paymaster.getDeposit());
    }

    function whitelistBundler(DaimoPaymasterV2 paymaster) public {
        address[] memory bundlers = new address[](1);
        bundlers[0] = 0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7; // Daimo API

        vm.startBroadcast();
        paymaster.setBundlerWhitelist(bundlers, true);
        vm.stopBroadcast();
    }

    function stop(DaimoPaymasterV2 paymaster) public {
        uint256 currentDeposit = paymaster.getDeposit();

        vm.startBroadcast();
        paymaster.withdrawTo(payable(msg.sender), currentDeposit);
        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
