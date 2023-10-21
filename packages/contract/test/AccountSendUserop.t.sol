// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";
import "./Utils.sol";

import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

contract AccountSendUseropTest is Test {
    using UserOperationLib for UserOperation;

    EntryPoint public entryPoint;
    DaimoAccountFactory public factory;

    function setUp() public {
        entryPoint = new EntryPoint();
        factory = new DaimoAccountFactory(entryPoint);
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
     * @param actualGasCost - actual amount paid (by account or paymaster) for this UserOperation.
     * @param actualGasUsed - total gas used by this UserOperation (including preVerification, creation, validation and execution).
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
        // hardcoded from swift playground
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint8 version = 1;
        uint48 validUntil = 0;
        bytes32 expectedUserOpHash = hex"ed2872f51164a6c9591034cf7268ce8be5ab3f99f9356200a08d11420af8266b";
        bytes memory challengeToSign = abi.encodePacked(
            version,
            validUntil,
            expectedUserOpHash
        );

        bytes memory ownerSig = abi.encodePacked(
            version,
            validUntil,
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: challengeToSign,
                    r: 0x817d68f6485389a101ccaa28001f00f24fd9ffc82930f347a6bbd468a9668066,
                    s: 0x36e3451c227a93263d6694331b25a50eb6c0608ff292a1027a231d8e0c9b19c7
                })
            )
        );

        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);
        DaimoAccount acc = factory.createAccount(0, key, calls, 42);
        console.log("new account address:", address(acc));
        vm.deal(address(acc), 1 ether);

        // dummy op
        UserOperation memory op = UserOperation({
            sender: address(0),
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            callGasLimit: 0,
            verificationGasLimit: 150000,
            preVerificationGas: 21000,
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 1e9,
            paymasterAndData: hex"",
            signature: hex"00"
        });

        // fill data
        op.sender = address(acc);
        op.callGasLimit = 200000;
        op.verificationGasLimit = 2000000;
        op.maxFeePerGas = 3e9;

        bytes32 hash = entryPoint.getUserOpHash(op);
        console2.log("op hash: ");
        console2.logBytes32(hash);
        assertEq(expectedUserOpHash, hash);

        op.signature = ownerSig;

        // expect a valid but reverting op
        UserOperation[] memory ops = new UserOperation[](1);
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

        // code coverage can't handle indirect calls
        // call validateUserOp directly
        DaimoAccount a2 = new DaimoAccount(acc.entryPoint());
        vm.store(address(a2), 0, 0); // set _initialized = 0
        a2.initialize(0, key, calls);
        vm.prank(address(entryPoint));
        uint256 validationData = a2.validateUserOp(op, hash, 0);
        assertEq(validationData, 0);
    }

    function testValidUntil() public {
        // hardcoded from swift playground
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint8 version = 1;
        uint48 validUntil = 1e9; // validUntil unix timestamp 1e9
        bytes32 expectedUserOpHash = hex"ed2872f51164a6c9591034cf7268ce8be5ab3f99f9356200a08d11420af8266b";
        bytes memory challengeToSign = abi.encodePacked(
            version,
            validUntil,
            expectedUserOpHash
        );

        bytes memory ownerSig = abi.encodePacked(
            version,
            validUntil,
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: challengeToSign,
                    r: 0x64426461cb87efcb38c9d0a202012712cf50d45dd5dc2ba10d9266ce71ccfc5d,
                    s: 0x6c8877c93fe31224ddba5a7a14579c77cb0fdb11717b21b089d3f62624c6c042
                })
            )
        );

        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);
        DaimoAccount acc = factory.createAccount(0, key, calls, 42);
        vm.deal(address(acc), 1 ether);

        // valid (but reverting) dummy userop
        UserOperation memory op = UserOperation({
            sender: address(acc),
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            callGasLimit: 200000,
            verificationGasLimit: 2000000,
            preVerificationGas: 21000,
            maxFeePerGas: 3e9,
            maxPriorityFeePerGas: 1e9,
            paymasterAndData: hex"",
            signature: ownerSig
        });

        // userop hash
        bytes32 hash = entryPoint.getUserOpHash(op);
        console2.log("op hash: ");
        console2.logBytes32(hash);
        assertEq(expectedUserOpHash, hash);

        // too late: can't execute after timestamp 1e9
        vm.warp(1e9 + 1);
        UserOperation[] memory ops = new UserOperation[](1);
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
