// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "eip-7212/P256Verifier.sol";
import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountVerify1271Test is Test {
    using UserOperationLib for UserOperation;

    address public verifier;
    EntryPoint public entryPoint;
    AccountFactory public factory;

    function setUp() public {
        verifier = address(new P256Verifier());
        entryPoint = new EntryPoint();
        factory = new AccountFactory(entryPoint, verifier);
        console.log("verifier address:", address(verifier));
        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
    }

    function testVerifySig() public {
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];
        bytes
            memory sig = hex"0001655c1753db6b61a9717e4ccc5d6c4bf7681623dd54c2d6babc55125756661cf073023b6de130f18510af41f64f067c39adccd59f8789a55dbbe822b0ea2317";

        DaimoAccount acc = factory.createAccount(0, key, new Call[](0), 0);
        console.log("new account address:", address(acc));
        vm.deal(address(acc), 1 ether);

        // check a valid signature
        bytes32 hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;
        bytes4 ret = acc.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE

        // check an invalid signature
        hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec6;
        ret = acc.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0xffffffff));
    }
}
