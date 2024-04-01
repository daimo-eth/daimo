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
    DaimoVerifier public verifier;
    DaimoAccountFactory public factory;

    uint8[] slots;
    bytes32[2][] initKeys;

    function setUp() public {
        entryPoint = new EntryPoint();
        verifier = new DaimoVerifier();
        factory = new DaimoAccountFactory(entryPoint, verifier);
        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));

        slots = new uint8[](1);
        slots[0] = 0;
        initKeys = new bytes32[2][](1);
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
        initKeys[0] = key;

        uint8 version = 1;
        uint48 validUntil = 0;
        bytes32 expectedUserOpHash = hex"c09eff100c833882cd94bc6b5d2e0d45af6ec978eb7f4a2e5174696bfee87488";
        bytes memory challengeToSign = abi.encodePacked(
            version,
            validUntil,
            expectedUserOpHash
        );

        bytes memory actualSignature = abi.encode( // signature
            Utils.rawSignatureToSignature({
                challenge: challengeToSign,
                r: 0x2dec57c39ecd3a573bb35e4d1bc16d3db6d5ee8ab024605aa910631d38bee5fe,
                s: 0x6036d125bc72d63a29ff6ab63e25a5273acb9824b818e919d83ed0f883d6e941
            })
        );
        uint16 sigLength = uint16(actualSignature.length);

        bytes memory ownerSig = abi.encodePacked(
            version,
            validUntil,
            uint8(1), // numSignatures
            uint8(0), // keySlot
            sigLength,
            actualSignature
        );

        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);
        DaimoAccount acc = factory.createAccount(slots, initKeys, 1, calls, 42);
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
        DaimoAccount a2 = new DaimoAccount(acc.entryPoint(), acc.verifier());
        vm.store(address(a2), 0, 0); // set _initialized = 0
        a2.initialize(slots, initKeys, 1, calls);
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
        initKeys[0] = key;

        uint8 version = 1;
        uint48 validUntil = 1e9; // validUntil unix timestamp 1e9
        bytes32 expectedUserOpHash = hex"c09eff100c833882cd94bc6b5d2e0d45af6ec978eb7f4a2e5174696bfee87488";
        bytes memory challengeToSign = abi.encodePacked(
            version,
            validUntil,
            expectedUserOpHash
        );

        bytes memory actualSignature = abi.encode( // signature
            Utils.rawSignatureToSignature({
                challenge: challengeToSign,
                r: 0x07d134db93e31d80eed6d093fcd15ad0fbd337ea2e5394f355307378345e8197,
                s: 0x05d84f80617a5077c431a936762826f1145c5834b8e23dff6f3d8b41321a5815
            })
        );
        uint16 sigLength = uint16(actualSignature.length);

        bytes memory ownerSig = abi.encodePacked(
            version,
            validUntil,
            uint8(1), // numSignatures
            uint8(0), // keySlot
            sigLength,
            actualSignature
        );

        DaimoAccount.Call[] memory calls = new DaimoAccount.Call[](0);
        DaimoAccount acc = factory.createAccount(slots, initKeys, 1, calls, 42);
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
