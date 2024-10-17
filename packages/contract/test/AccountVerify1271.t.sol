// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./dummy/DaimoDummyUSDC.sol";
import "./Utils.sol";

contract AccountVerify1271Test is Test {
    EntryPoint public entryPoint;
    DaimoAccountFactoryV2 public factory;
    DaimoAccountV2 public accA;
    DaimoAccountV2 public accB;
    bytes32 public messageHash =
        0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;

    function setUp() public {
        entryPoint = new EntryPoint();
        factory = new DaimoAccountFactoryV2(entryPoint);

        // Create test account with a single signing key
        uint256[2] memory pubKey = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(pubKey[0]), bytes32(pubKey[1])];

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        accA = factory.createAccount(
            8453, // home chain = Base Mainnet
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key,
            0 // salt
        );
        console.log("new account address:", address(accA));

        // Create a second account, add same key
        accB = factory.createAccount(
            8453, // home chain = Base Mainnet
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key,
            1 // salt
        );

        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        console.log("accA address:", address(accA));
        console.log("accB address:", address(accB));
    }

    /// Basic verification: isValidSignature() distguishes valid/invalid.
    function testVerifySig() public view {
        // Non-malleable signature. s is <= n/2
        bytes memory sig = abi.encode(
            Utils.rawSignatureToSignature({
                keySlot: 0,
                challenge: abi.encodePacked(address(accA), messageHash),
                r: 0x827f3eac133f9c48222cf09280bcee3098aeebfc7869d2fa0ca01caeae962e0a,
                s: 0x3acb7efc72598ffe60b00361b59975a8bfc6f9fd843b523be66b15f82ad4b5b9
            })
        );

        // check a valid signature
        bytes4 ret = accA.isValidSignature(messageHash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE

        // check an invalid signature
        bytes32 otherMessageHash = bytes32(uint256(messageHash) + 1);
        ret = accA.isValidSignature(otherMessageHash, sig);
        assertEq(ret, bytes4(0xffffffff));
    }

    /// Malleability: reject high-s signatures.
    function testSignatureMalleability() public view {
        // Malleable signature. s is > n/2
        uint256 r = 0x827f3eac133f9c48222cf09280bcee3098aeebfc7869d2fa0ca01caeae962e0a;
        uint256 s = 0xc53481028da670029f4ffc9e4a668a56fd2000b022dc4c490d4eb4cad18e6f98;
        bytes memory sig = abi.encode(
            Utils.rawSignatureToSignature({
                keySlot: 0,
                challenge: abi.encodePacked(address(accA), messageHash),
                r: r,
                s: s
            })
        );

        // Malleable signature is NOT accepted
        bytes4 ret = accA.isValidSignature(messageHash, sig);
        assertEq(ret, bytes4(0xffffffff));

        // Fix the signature by changing s
        uint256 n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
        s = n - s;
        sig = abi.encode( // signature
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: abi.encodePacked(address(accA), messageHash),
                    r: r,
                    s: s
                })
            );
        console.log("fixed sig s:", s);

        // Now it's accepted
        ret = accA.isValidSignature(messageHash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE
    }

    /// Reuse: signature for Account A invalid for Account B with same key.
    function testSignatureReuse() public view {
        bytes memory sig = abi.encode(
            Utils.rawSignatureToSignature({
                keySlot: 0,
                challenge: abi.encodePacked(address(accA), messageHash),
                r: 0x827f3eac133f9c48222cf09280bcee3098aeebfc7869d2fa0ca01caeae962e0a,
                s: 0x3acb7efc72598ffe60b00361b59975a8bfc6f9fd843b523be66b15f82ad4b5b9
            })
        );

        // valid for account A
        bytes4 ret = accA.isValidSignature(messageHash, sig);
        assertEq(ret, bytes4(0x1626ba7e));

        // not valid for account B with same key
        ret = accB.isValidSignature(messageHash, sig);
        assertEq(ret, bytes4(0xffffffff));

        // simply changing the challenge also doesn't work
        ret = accB.isValidSignature(
            messageHash,
            abi.encode(
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: abi.encodePacked(address(accB), messageHash),
                    r: 0x827f3eac133f9c48222cf09280bcee3098aeebfc7869d2fa0ca01caeae962e0a,
                    s: 0x3acb7efc72598ffe60b00361b59975a8bfc6f9fd843b523be66b15f82ad4b5b9
                })
            )
        );
        assertEq(ret, bytes4(0xffffffff));

        // new challenge, new signature valid for account B
        ret = accB.isValidSignature(
            messageHash,
            abi.encode(
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: abi.encodePacked(address(accB), messageHash),
                    r: 0xc7817647cc621297c76ebaf2aefda18c92896c1a85559ec30e3e8bc4391ffed7,
                    s: 0x67fdcd17ffb9cb5f306617a4b09661b95aebfdc59396b1501b806df809a1bd7b
                })
            )
        );
        assertEq(ret, bytes4(0x1626ba7e));
    }
}
