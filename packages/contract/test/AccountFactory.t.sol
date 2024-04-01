// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";
import "../src/DaimoVerifier.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountFactoryTest is Test {
    using UserOperationLib for UserOperation;

    EntryPoint public entryPoint;
    DaimoAccountFactory public factory;
    DaimoVerifier public verifier;
    uint8[] slots;
    bytes32[2][] initKeys;
    bytes32[2] key1;

    function setUp() public {
        entryPoint = new EntryPoint();
        verifier = new DaimoVerifier();
        factory = new DaimoAccountFactory(entryPoint, verifier);

        slots = new uint8[](1);
        slots[0] = 0;
        initKeys = new bytes32[2][](1);
        key1 = [bytes32(0), bytes32(0)];
        initKeys[0] = key1;
    }

    function testDeploy() public {
        // deploy account
        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);
        DaimoAccount acc = factory.createAccount{value: 0}(slots, initKeys, 1, calls, 42);
        console.log("new account address:", address(acc));
        assertEq(acc.numActiveKeys(), uint8(1));

        // deploy again = just returns the existing address
        // prefund still goes thru to the entrypoint contract
        assertEq(entryPoint.getDepositInfo(address(acc)).deposit, 0);
        DaimoAccount acc2 = factory.createAccount{value: 9}(slots, initKeys, 1, calls, 42);
        assertEq(address(acc), address(acc2));
        assertEq(entryPoint.getDepositInfo(address(acc)).deposit, 9);

        // get the counterfactual address, should be same
        address counterfactual = factory.getAddress(slots, initKeys, 1, calls, 42);
        assertEq(address(acc), counterfactual);
    }

    function testMultisigDeploy() public {
        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);

        uint8[] memory multisigSlots = new uint8[](3);
        multisigSlots[0] = 0;
        multisigSlots[1] = 1;
        multisigSlots[2] = 2;

        bytes32[2][] memory multisigKeys = new bytes32[2][](3);
        bytes32[2] memory multisigKey0 = [bytes32(0), bytes32(0)];
        bytes32[2] memory multisigKey1 = [bytes32(0), bytes32(0)];
        bytes32[2] memory multisigKey2 = [bytes32(0), bytes32(0)];
        multisigKeys[0] = multisigKey0;
        multisigKeys[1] = multisigKey1;
        multisigKeys[2] = multisigKey2;

        DaimoAccount acc = factory.createAccount{value: 0}(multisigSlots, multisigKeys, 2, calls, 42);
        console.log("new account address:", address(acc));
        assertEq(acc.numActiveKeys(), uint8(3));
        assertEq(acc.signatureThreshold(), uint8(2));
    }
}
