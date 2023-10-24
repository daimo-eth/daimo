// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";
import "./Utils.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountVerify1271Test is Test {
    using UserOperationLib for UserOperation;

    EntryPoint public entryPoint;
    DaimoVerifier public verifier;
    DaimoAccountFactory public factory;
    DaimoAccount public account;

    function setUp() public {
        entryPoint = new EntryPoint();
        verifier = new DaimoVerifier();
        factory = new DaimoAccountFactory(entryPoint, verifier);

        // Create test account with a single signing key
        uint256[2] memory pubKey = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(pubKey[0]), bytes32(pubKey[1])];
        account = factory.createAccount(0, key, new DaimoAccount.Call[](0), 0);

        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        console.log("account address:", address(account));
    }

    function testVerifySig() public {
        // Non-malleable signature. s is <= n/2
        bytes memory sig = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: abi.encodePacked(
                        bytes32(
                            0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5
                        )
                    ),
                    r: 0x3f033e5c93d0310f33632295f64d526f7569c4cb30895f50d60de5fe9e0e6a9a,
                    s: 0x2adcff2bd06fc3cdd03e21e5e4c197913e96e75cad0bc6e9c9c14607af4f3a37
                })
            )
        );

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
        uint256 s = 0xd52300d32f903c332fc1de1a1b3e686e7e501350fa0bd79b29f884bb4d13eb1a;
        bytes memory sig = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: abi.encodePacked(
                        bytes32(
                            0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5
                        )
                    ),
                    r: 0x3f033e5c93d0310f33632295f64d526f7569c4cb30895f50d60de5fe9e0e6a9a,
                    s: s
                })
            )
        );

        // Malleable signature is NOT accepted
        bytes32 hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;
        bytes4 ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0xffffffff));

        // Fix the signature by changing s
        uint256 n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
        s = n - s;
        sig = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: abi.encodePacked(
                        bytes32(
                            0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5
                        )
                    ),
                    r: 0x3f033e5c93d0310f33632295f64d526f7569c4cb30895f50d60de5fe9e0e6a9a,
                    s: s
                })
            )
        );
        console.log("fixed sig s:", s);

        // Now it's accepted
        ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE
    }
}
