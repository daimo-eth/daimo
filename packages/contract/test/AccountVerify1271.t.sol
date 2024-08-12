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
                r: 0x9f2895fbc4d2e804efa74d8eae3059cb90753716001e4dbcb09f42279868d332,
                s: 0x0b61be680069f89717947cf596429c59968120bdb7f5d8abe29907fbf5d119c7
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
        uint256 s = 0x8143a23c473934de29cdf193bc198af1e36d6a4eff5d7be671535faed920530c;
        bytes memory sig = abi.encode(
            Utils.rawSignatureToSignature({
                keySlot: 0,
                challenge: abi.encodePacked(address(accA), messageHash),
                r: 0xec408f2b9df11ad4dfdd4b26bb83c8092eb0eab0030f821c276567eb24060d40,
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
                    r: 0xec408f2b9df11ad4dfdd4b26bb83c8092eb0eab0030f821c276567eb24060d40,
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
                r: 0x9f2895fbc4d2e804efa74d8eae3059cb90753716001e4dbcb09f42279868d332,
                s: 0x0b61be680069f89717947cf596429c59968120bdb7f5d8abe29907fbf5d119c7
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
                    r: 0x9f2895fbc4d2e804efa74d8eae3059cb90753716001e4dbcb09f42279868d332,
                    s: 0x0b61be680069f89717947cf596429c59968120bdb7f5d8abe29907fbf5d119c7
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
                    r: 0x55d3ecae828a0aa581b07d91a8f71f207c3d20d0005abdb6eb83090b1604c30a,
                    s: 0x4a9d7475bbf2936c541d5c304bdfae7bff4cecd012f12916307b050a78e0ebba
                })
            )
        );
        assertEq(ret, bytes4(0x1626ba7e));
    }
}
