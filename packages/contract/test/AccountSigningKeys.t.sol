// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./dummy/DaimoDummyUSDC.sol";

contract AccountSigningKeysTest is Test {
    EntryPoint public entryPoint;
    DaimoAccountFactoryV2 public factory;

    function setUp() public {
        entryPoint = new EntryPoint();
        factory = new DaimoAccountFactoryV2(entryPoint);
    }

    function testAddingAndRemovingKeys() public {
        // hardcoded from swift playground
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        uint256[2] memory key2u = [
            0x1bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421da,
            0xa54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43
        ];
        bytes32[2] memory key1 = [bytes32(key1u[0]), bytes32(key1u[1])];
        bytes32[2] memory key2 = [bytes32(key2u[0]), bytes32(key2u[1])];

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        DaimoAccountV2 acc = factory.createAccount(
            8453, // home chain = Base Mainnet
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key1,
            42 // salt
        );
        console.log("new account address:", address(acc));
        assertTrue(acc.numActiveKeys() == uint8(1));

        vm.expectRevert("DAv2: only self");
        acc.addSigningKey(1, key2);

        vm.startPrank(address(acc));

        // add key2
        // use a high slot, higher than maxKeys, to ensure that works
        vm.expectEmit(true, true, true, false);
        emit DaimoAccountV2.SigningKeyAdded(200, key2);
        acc.addSigningKey(200, key2);
        assertTrue(acc.numActiveKeys() == uint8(2));

        // add zero key
        bytes32[2] memory keyZero = [bytes32(0), bytes32(0)];
        vm.expectRevert("DAv2: new key cannot be 0");
        acc.addSigningKey(1, keyZero);

        // remove key1
        vm.expectEmit(true, true, true, false);
        emit DaimoAccountV2.SigningKeyRemoved(0, key1);
        acc.removeSigningKey(0);
        assertTrue(acc.numActiveKeys() == uint8(1));

        // remove nonexistent key
        vm.expectRevert("DAv2: key does not exist");
        acc.removeSigningKey(199);

        // remove key2
        vm.expectRevert("DAv2: cannot remove only signing key");
        acc.removeSigningKey(200);

        vm.stopPrank();
    }

    function testGetSigningKeys() public {
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        uint256[2] memory key2u = [
            0x1bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421da,
            0xa54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43
        ];
        bytes32[2] memory key1 = [bytes32(key1u[0]), bytes32(key1u[1])];
        bytes32[2] memory key2 = [bytes32(key2u[0]), bytes32(key2u[1])];

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        DaimoAccountV2 acc = factory.createAccount(
            8453, // home chain = Base Mainnet
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key1,
            42 // salt
        );
        console.log("new account address:", address(acc));
        assertTrue(acc.numActiveKeys() == uint8(1));

        // ensure initial key retrieves correctly
        bytes32[2][] memory keys;
        uint8[] memory slots;
        (keys, slots) = acc.getActiveSigningKeys();
        assertEq(keys.length, 1);
        assertEq(slots.length, 1);
        assertEq(keys[0][0], key1[0]);
        assertEq(keys[0][1], key1[1]);
        assertEq(slots[0], 0);

        // add a second key, ensure retrieval
        vm.startPrank(address(acc));
        acc.addSigningKey(1, key2);
        (keys, slots) = acc.getActiveSigningKeys();
        assertEq(keys.length, 2);
        assertEq(slots.length, 2);
        assertEq(slots[0], 0);
        assertEq(slots[1], 1);

        // remove the first key, ensure retrieval
        acc.removeSigningKey(0);
        (keys, slots) = acc.getActiveSigningKeys();
        assertEq(keys.length, 1);
        assertEq(slots.length, 1);
        assertEq(keys[0][0], key2[0]);
        assertEq(keys[0][1], key2[1]);
        assertEq(slots[0], 1);
    }
}
