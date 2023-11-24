// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/DaimoPaymaster.sol";
import "openzeppelin-contracts/contracts/utils/Create2.sol";

contract DeployPaymasterScript is Script {
    // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
    IEntryPoint public entryPoint =
        IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    function deploy() public {
        vm.startBroadcast();

        // Use CREATE2
        new DaimoPaymaster{salt: 0}(entryPoint, msg.sender);

        vm.stopBroadcast();
    }

    function start(
        DaimoPaymaster paymaster,
        address ticketSigner
    ) public payable {
        // start by staking paymaster: this is currently commented out
        // because Pimlico doesn't seem to be using it.
        // paymaster.addStake{value: 0.05 ether}(86400);

        // deposit for paymaster
        addDeposit(paymaster);

        // whitelist destinations for paymaster
        whitelistDests(paymaster);

        // set ticket signer
        setTicketSigner(paymaster, ticketSigner);
    }

    function addDeposit(DaimoPaymaster paymaster) public payable {
        console.log("previous deposit:", paymaster.getDeposit());

        vm.startBroadcast();
        paymaster.deposit{value: 0.01 ether}();
        vm.stopBroadcast();

        console.log("new deposit:", paymaster.getDeposit());
    }

    function whitelistDests(DaimoPaymaster paymaster) public {
        // whitelist destination addresses
        address[] memory dests = new address[](3);
        dests[0] = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base USDC
        dests[1] = 0x1B85deDe8178E18CdE599B4C9d913534553C3dBf; // CREATE-2ed Base Goerli testnet USDC
        dests[2] = 0x4AdcA7cB84497c9c4c308063D2f219C7b6041183; // CREATE-2ed DaimoEphemeralNotes
        // note that the name registry contract is not called by the account directly

        vm.startBroadcast();
        paymaster.setDestAddressWhitelist(dests, true);
        vm.stopBroadcast();
    }

    function setTicketSigner(DaimoPaymaster paymaster, address signer) public {
        vm.startBroadcast();
        paymaster.setTicketSigner(signer);
        vm.stopBroadcast();
    }

    function stop(DaimoPaymaster paymaster) public {
        uint256 currentDeposit = paymaster.getDeposit();

        vm.startBroadcast();
        paymaster.withdrawTo(payable(msg.sender), currentDeposit);
        vm.stopBroadcast();
    }

    // Exclude from forge coverage
    function test() public {}
}
