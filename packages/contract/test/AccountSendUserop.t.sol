// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoP256SHA256.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountSendUseropTest is Test {
    using UserOperationLib for UserOperation;

    P256SHA256 public verifier;
    EntryPoint public entryPoint;
    AccountFactory public factory;

    function setUp() public {
        verifier = new P256SHA256();
        entryPoint = new EntryPoint();
        factory = new AccountFactory(entryPoint, verifier);
        console.log("verifier address:", address(verifier));
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
        bytes32[2] memory key = [
            bytes32(
                hex"65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4"
            ),
            bytes32(
                hex"4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437"
            )
        ];
        bytes
            memory ownerSig = hex"0001655c1753db6b61a9717e4ccc5d6c4bf7681623dd54c2d6babc55125756661cf073023b6de130f18510af41f64f067c39adccd59f8789a55dbbe822b0ea2317";

        Call[] memory calls = new Call[](0);
        DaimoAccount acc = factory.createAccount(key, calls, 42);
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

        op.signature = ownerSig;

        // vm.expectRevert(entryPoint.ValidationResult((1417770, 6663000000000000, true, 0, 281474976710655, 0x00), (0, 0), (0, 0), (0, 0)));
        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = op;
        vm.expectEmit(false, false, false, false);
        emit UserOperationEvent(
            hash,
            address(acc),
            address(0),
            42,
            false,
            0,
            0
        );
        entryPoint.handleOps(ops, payable(address(acc)));
    }
}
