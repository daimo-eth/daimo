// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";
import "../src/DaimoTestUSDC.sol";
import "./Utils.sol";

contract AccountSendUseropTest is Test {
    using UserOperationLib for UserOperation;

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

    // TODO: re-enable after fixing flake
    function disabledTestSimpleOp() public {
        // hardcoded from swift playground
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint48 validUntil = 0;
        bytes32 expectedUserOpHash = hex"5a9a980b6256506cd83fd0462db050883f344508d2698897ae210475c80acb0b";
        bytes memory challengeToSign = abi.encodePacked(
            validUntil,
            expectedUserOpHash
        );

        bytes memory ownerSig = abi.encodePacked(
            validUntil,
            abi.encode(
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: challengeToSign,
                    r: 0x95287be7cb8c72c4aeee050bb0448fed83b1330a1ba2edcb6835525c9c07b006,
                    s: 0x656E96974C5170EFA7D65FFB4F61A793B0DA4AC9E346E5B28F9739FE3AF2B096
                })
            )
        );

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        DaimoAccountV2 acc = factory.createAccount(
            84532, // home chain = Base Sepolia
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
        DaimoAccountV2 a2 = new DaimoAccountV2(acc.entryPoint());
        uint256[2] memory key2u = [
            0x1bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421da,
            0xa54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43
        ];
        bytes32[2] memory key2 = [bytes32(key2u[0]), bytes32(key2u[1])];
        vm.store(address(a2), 0, 0); // set _initialized = 0
        a2.initialize(
            84532, // home chain = Base Sepolia
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key2
        );
        vm.prank(address(entryPoint));
        uint256 validationData = a2.validateUserOp(op, hash, 0);
        assertEq(validationData, 0);
    }

    // TODO: re-enable after fixing flake
    function disabledTestValidUntil() public {
        // hardcoded from swift playground
        uint256[2] memory key1u = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(key1u[0]), bytes32(key1u[1])];

        uint48 validUntil = 1e9; // validUntil unix timestamp 1e9
        bytes32 expectedUserOpHash = hex"5a9a980b6256506cd83fd0462db050883f344508d2698897ae210475c80acb0b";
        bytes memory challengeToSign = abi.encodePacked(
            validUntil,
            expectedUserOpHash
        );

        bytes memory ownerSig = abi.encodePacked(
            validUntil,
            abi.encode(
                Utils.rawSignatureToSignature({
                    keySlot: 0,
                    challenge: challengeToSign,
                    r: 0x2b17a942c427b4c0e691feb6efe6d65abdcdc5d56ca45bf1aa4822c3d8935f47,
                    s: 0x37E6C05C93ABA7F7ED5A8921499F65BC7462959B92E8D371BA23367EBA564B9E
                })
            )
        );

        // Create a new Daimo account
        TestUSDC usdc = new TestUSDC();
        DaimoAccountV2 acc = factory.createAccount(
            84532, // home chain = Base Sepolia
            usdc,
            IDaimoSwapper(address(0)), // inbound swap+bridge unsupported
            IDaimoBridger(address(0)),
            0,
            key,
            42 // salt
        );
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
