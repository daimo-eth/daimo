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

    /***
     * An event emitted after each successful request
     * @param userOpHash - unique identifier for the request (hash its entire content, except signature).
     * @param sender - the account that generates this request.
     * @param paymaster - if non-null, the paymaster that pays for this request.
     * @param nonce - the nonce value from the request.
     * @param success - true if the sender transaction succeeded, false if reverted.
     * @param actualGasCost - actual amount paid (by account or paymaster) for this userop.
     * @param actualGasUsed - total gas used by this userop (including preVerification, creation, validation and execution).
     */
    event UserOperationEvent(
        bytes32 indexed userOpHash,
        address indexed sender,
        address indexed paymaster,
        uint256 nonce,
        bool success,
        uint256 actualGasCost,
        uint256 actualGasUsed
    );

    function testSimpleOp() public {
        // Generated from private key in apps/swift-testing-playground/p256.playground/Contents.swift
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint48 validUntil = 0;
        bytes32 expectedUserOpHash = hex"f8a76c8c428c21d5b3940a34861079ded59efd427edee75d7983875996bbc51c";
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
                    r: 0x651f58864a6cb90c859cf444474ffc81f612f0a5ae08169b77a2c8c68a3a814e,
                    s: 0x2945611d9e7ecdcccf30ebe40192bb23e6f0036c3997315ffe612939d938f567
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
        emit UserOperationEvent(
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
        bytes32 expectedUserOpHash = hex"f8a76c8c428c21d5b3940a34861079ded59efd427edee75d7983875996bbc51c";
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
                    r: 0x70acbff444e05edc2661627e4ac6ec3284c4e3f5f09439e9a6555a9696bddd7a,
                    s: 0x67d0e43bfe9f6324c2652d75a07024f8ed278bf4689fadcfda30ae593ac8f447
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
