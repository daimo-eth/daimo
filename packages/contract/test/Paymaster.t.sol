// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import "account-abstraction/interfaces/UserOperation.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/DaimoPaymaster.sol";
import "../src/DaimoAccount.sol";

contract PaymasterTest is Test {
    IEntryPoint public entryPoint;
    address public owner;

    DaimoPaymaster public paymaster;

    function setUp() public {
        entryPoint = new EntryPoint();
        owner = 0x2222222222222222222222222222222222222222;
        paymaster = new DaimoPaymaster(entryPoint, owner);
    }

    function testWhitelisting() public {
        vm.startPrank(owner);
        address[] memory whitelist = new address[](1);
        whitelist[0] = 0x3333333333333333333333333333333333333333;
        paymaster.setDestAddressWhitelist(whitelist, true);

        address[] memory blacklist = new address[](1);
        blacklist[0] = 0x4444444444444444444444444444444444444444;
        paymaster.setSenderAddressBlacklist(blacklist, true);

        assertTrue(paymaster.senderBlacklist(blacklist[0]));
        assertTrue(paymaster.destWhitelist(whitelist[0]));
        vm.stopPrank();

        vm.expectRevert("Ownable: caller is not the owner");
        paymaster.setDestAddressWhitelist(whitelist, false);

        vm.expectRevert("Ownable: caller is not the owner");
        paymaster.setSenderAddressBlacklist(blacklist, false);
    }

    function testUserOpValidation() public {
        vm.startPrank(address(entryPoint));

        address senderAddress = address(
            0x5555555555555555555555555555555555555555
        );

        // try self call, should pass
        Call[] memory dummyCalls = new Call[](1);
        dummyCalls[0] = Call({dest: senderAddress, value: 0, data: hex""});

        bytes memory dummyCalldata = abi.encodeWithSelector(
            DaimoAccount.executeBatch.selector,
            dummyCalls
        );

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
        op.sender = address(0x5555555555555555555555555555555555555555);
        op.callData = dummyCalldata;
        op.paymasterAndData = abi.encodePacked(address(paymaster));
        bytes32 hash = entryPoint.getUserOpHash(op);

        (, uint256 validationData) = paymaster.validatePaymasterUserOp(
            op,
            hash,
            500000
        );
        bool sigFailed = uint160(validationData) == 1;
        assertEq(sigFailed, false);

        // try without any calls, should fail
        dummyCalldata = abi.encodeWithSelector(
            DaimoAccount.executeBatch.selector,
            new Call[](0)
        );
        op.callData = dummyCalldata;

        vm.expectRevert("DaimoPaymaster: no calls");
        paymaster.validatePaymasterUserOp(op, hash, 500000);

        // try with a call to a non-whitelisted address, should fail
        dummyCalls[0] = Call({
            dest: 0x6666666666666666666666666666666666666666,
            value: 0,
            data: hex""
        });

        dummyCalldata = abi.encodeWithSelector(
            DaimoAccount.executeBatch.selector,
            dummyCalls
        );
        op.callData = dummyCalldata;
        vm.expectRevert(
            "DaimoPaymaster: call dest not whitelisted and not self"
        );
        paymaster.validatePaymasterUserOp(op, hash, 500000);

        vm.stopPrank();

        vm.startPrank(owner);
        address[] memory whitelist = new address[](1);
        whitelist[0] = 0x6666666666666666666666666666666666666666;
        paymaster.setDestAddressWhitelist(whitelist, true);
        vm.stopPrank();

        vm.startPrank(address(entryPoint));

        // should pass now
        (, validationData) = paymaster.validatePaymasterUserOp(
            op,
            hash,
            500000
        );
        sigFailed = uint160(validationData) == 1;
        assertEq(sigFailed, false);
        vm.stopPrank();
    }
}
