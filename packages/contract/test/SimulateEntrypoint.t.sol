// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/P256SHA256.sol";
import "../src/AccountFactory.sol";
import "../src/Account.sol";

import "account-abstraction/core/EntryPoint.sol";

contract EntrypointTest is Test {
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
    event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed);


    function testSimpleOp() public {
        // hardcoded from swift playground
        bytes memory ownerPK = hex"65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e44a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437";
        bytes memory ownerSig = hex"c6a8e819b7d64188487b7bb09f24e0e024b592d35a725e7dcc1199a2738731610d49b29d5573be70f40f54be1c942807e6d1648352af4fdd39572314aaf6ff3c";

        Account acc = factory.createAccount(ownerPK, 42);
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
        console2.log("op hash: "); console2.logBytes32(hash);

        op.signature = ownerSig;
        
        // vm.expectRevert(entryPoint.ValidationResult((1417770, 6663000000000000, true, 0, 281474976710655, 0x00), (0, 0), (0, 0), (0, 0)));
        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = op;
        vm.expectEmit(false, false, false, false);
        emit UserOperationEvent(hash, address(acc), address(0), 42, false, 0, 0);
        entryPoint.handleOps(ops, payable(address(acc)));
    }
}
