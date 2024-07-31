// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/DaimoPaymasterV2.sol";
import "../src/DaimoAccountV2.sol";
import "./Utils.sol";

contract PaymasterTest is Test {
    DaimoPaymasterV2 public paymaster;
    IEntryPoint public entryPoint;
    address public owner;

    function setUp() public {
        entryPoint = new EntryPoint();
        owner = 0x2222222222222222222222222222222222222222;
        paymaster = new DaimoPaymasterV2(entryPoint, owner);
    }

    function testWhitelisting() public {
        address[] memory whitelist = new address[](1);
        whitelist[0] = 0x3333333333333333333333333333333333333333;
        vm.prank(owner);
        paymaster.setBundlerWhitelist(whitelist, true);

        assertTrue(paymaster.bundlerWhitelist(whitelist[0]));

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                address(this)
            )
        );
        paymaster.setBundlerWhitelist(whitelist, false);
    }

    function testUserOpValidation() public {
        address bundlerAddr = address(0x420);

        // dummy op
        PackedUserOperation memory op = PackedUserOperation({
            sender: 0x5555555555555555555555555555555555555555,
            nonce: 0,
            initCode: hex"",
            callData: hex"00",
            accountGasLimits: Utils.packAccountGasLimits({
                verificationGasLimit: 150000,
                callGasLimit: 0
            }),
            preVerificationGas: 21000,
            gasFees: Utils.packGasFees({
                maxPriorityFeePerGas: 1e9,
                maxFeePerGas: 0
            }),
            paymasterAndData: hex"",
            signature: hex"00"
        });

        // send without no whitelist. fails
        op.paymasterAndData = abi.encodePacked(address(paymaster));
        bytes32 hash = entryPoint.getUserOpHash(op);

        vm.prank(address(entryPoint), bundlerAddr);
        vm.expectRevert("DaimoPaymaster: non-whitelisted tx.origin");
        paymaster.validatePaymasterUserOp(op, hash, 5e5);

        // whitelist bundler
        vm.prank(owner);
        address[] memory whitelist = new address[](1);
        whitelist[0] = bundlerAddr;
        paymaster.setBundlerWhitelist(whitelist, true);

        // try again. should succeed
        vm.prank(address(entryPoint), bundlerAddr);
        uint256 validationData;
        (, validationData) = paymaster.validatePaymasterUserOp(op, hash, 5e5);
        assertEq(uint160(validationData), 0); // success, valid op
    }
}
