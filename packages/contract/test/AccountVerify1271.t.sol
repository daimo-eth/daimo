// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "p256-verifier/P256Verifier.sol";
import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountVerify1271Test is Test {
    using UserOperationLib for UserOperation;

    address public verifier;
    EntryPoint public entryPoint;
    DaimoAccountFactory public factory;
    DaimoAccount public account;

    function setUp() public {
        verifier = address(new P256Verifier());
        entryPoint = new EntryPoint();
        factory = new DaimoAccountFactory(entryPoint, verifier);

        // Create test account with a single signing key
        uint256[2] memory pubKey = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(pubKey[0]), bytes32(pubKey[1])];
        account = factory.createAccount(0, key, new Call[](0), 0);

        console.log("verifier address:", address(verifier));
        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        console.log("account address:", address(account));
    }

    function testVerifySig() public {
        // Non-malleable signature. s is <= n/2
        uint256 r = 0x01655c1753db6b61a9717e4ccc5d6c4bf7681623dd54c2d6babc55125756661c;
        uint256 s = 7033802732221576339889804108463427183539365869906989872244893535944704590394;
        bytes memory sig = abi.encodePacked(hex"00", r, s); // keySlot, r, s

        // check a valid signature
        bytes32 hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;
        bytes4 ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE

        // check an invalid signature
        hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec6;
        ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0xffffffff));
    }

    function testSignatureMalleability() public {
        // Malleable signature. s is > n/2
        uint256 r = 0x01655c1753db6b61a9717e4ccc5d6c4bf7681623dd54c2d6babc55125756661c;
        uint256 s = 0xf073023b6de130f18510af41f64f067c39adccd59f8789a55dbbe822b0ea2317;
        bytes memory sig = abi.encodePacked(hex"00", r, s); // keySlot, r, s

        // Malleable signature is NOT accepted
        bytes32 hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;
        bytes4 ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0xffffffff));

        // Fix the signature by changing s
        uint256 n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
        s = n - s;
        sig = abi.encodePacked(hex"00", r, s); // keySlot, r, s
        console.log("fixed sig s:", s);

        // Now it's accepted
        ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE
    }
}
