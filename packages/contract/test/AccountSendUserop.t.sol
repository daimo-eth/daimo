// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "./dummy/DaimoDummyUSDC.sol";
import "./Utils.sol";

contract AccountSendUseropTest is Test {
    EntryPoint public entryPoint;
    DaimoAccountFactoryV2 public factory;

    function setUp() public {
        entryPoint = new EntryPoint();
        factory = new DaimoAccountFactoryV2(entryPoint);
        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
    }

    function testSimpleOp() public {
        // Generated from private key in packages/contract/script/createSignature.ts
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint48 validUntil = 0;
        bytes32 expectedUserOpHash = hex"d85d07248f1322e02b80328b1581926dc8525cc3a2e8913c184252e82842b2b6";
        bytes memory challengeToSign = abi.encodePacked(
            validUntil,
            expectedUserOpHash
        );

        // (r, s) signature generated using (public key, user op hash, validUntil)
        // as inputs. The signature is can be generated using the script in
        // packages/contract/script/createSignature.ts
        bytes memory ownerSig = abi.encodePacked(
            validUntil,
            abi.encode(
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: challengeToSign,
                    r: 0x4e1230ae096f92b4574d949da3729d0ac83b930fdb119f3ab23841817d8910cb,
                    s: 0x05524609e42612db20d039a5e3ea6e7ef89b30d57738f1c14e8c2259974ab555
                })
            )
        );

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        DaimoAccountV2 acc = factory.createAccount(
            8453, // home chain = Base
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key,
            42 // salt
        );
        console.log("new account address:", address(acc));
        vm.deal(address(acc), 1 ether);

        // dummy op
        PackedUserOperation memory op = PackedUserOperation({
            sender: address(acc),
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            accountGasLimits: Utils.packAccountGasLimits({
                verificationGasLimit: 2000000,
                callGasLimit: 200000
            }),
            preVerificationGas: 21000,
            gasFees: Utils.packGasFees({
                maxPriorityFeePerGas: 1e9,
                maxFeePerGas: 3e9
            }),
            paymasterAndData: hex"",
            signature: hex"00"
        });

        bytes32 hash = entryPoint.getUserOpHash(op);
        console2.log("op hash: ");
        console2.logBytes32(hash);
        assertEq(hash, expectedUserOpHash);

        op.signature = ownerSig;

        // expect a valid but reverting op
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        vm.expectEmit(true, true, true, false);
        emit IEntryPoint.UserOperationEvent(
            hash,
            address(acc),
            address(0),
            0, // These and following are not checked.
            false,
            0 gwei,
            0
        );
        entryPoint.handleOps(ops, payable(address(acc)));
    }

    function testValidUntil() public {
        // Generated from private key in apps/swift-testing-playground/p256.playground/Contents.swift
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint48 validUntil = 1e9; // validUntil unix timestamp 1e9
        bytes32 expectedUserOpHash = hex"d85d07248f1322e02b80328b1581926dc8525cc3a2e8913c184252e82842b2b6";
        bytes memory challengeToSign = abi.encodePacked(
            validUntil,
            expectedUserOpHash
        );

        // (r, s) signature generated from public key, user op hash, and validUntil in
        // apps/swift-testing-playground/p256.playground/Contents.swift
        bytes memory ownerSig = abi.encodePacked(
            validUntil,
            abi.encode(
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: challengeToSign,
                    r: 0x8aba3085fdd6faa3041e9ced9d91c2dbb4154206ce3e0f21f247e406798fea51,
                    s: 0x14d15b504a29dc13a2dd3ba56bea8d9e68cbe66b8ec1e44784134734fa6df0a9
                })
            )
        );

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        DaimoAccountV2 acc = factory.createAccount(
            8453, // home chain = Base
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key,
            42 // salt
        );
        vm.deal(address(acc), 1 ether);

        // valid (but reverting) dummy userop
        PackedUserOperation memory op = PackedUserOperation({
            sender: address(acc),
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            accountGasLimits: Utils.packAccountGasLimits({
                verificationGasLimit: 2000000,
                callGasLimit: 200000
            }),
            preVerificationGas: 21000,
            gasFees: Utils.packGasFees({
                maxPriorityFeePerGas: 1e9,
                maxFeePerGas: 3e9
            }),
            paymasterAndData: hex"",
            signature: ownerSig
        });

        // userop hash
        bytes32 hash = entryPoint.getUserOpHash(op);
        console2.log("op hash: ");
        console2.logBytes32(expectedUserOpHash);
        assertEq(hash, expectedUserOpHash);

        // too late: can't execute after timestamp 1e9
        vm.warp(1e9 + 1);
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = op;
        vm.expectRevert(
            abi.encodeWithSelector(
                IEntryPoint.FailedOp.selector,
                0,
                "AA22 expired or not due"
            )
        );
        entryPoint.handleOps(ops, payable(address(acc)));

        // just early enough: can execute at timestamp 1e9
        vm.warp(1e9);
        entryPoint.handleOps(ops, payable(address(acc)));
    }
}
