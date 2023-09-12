// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "p256-verifier/P256Verifier.sol";
import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountFactoryTest is Test {
    using UserOperationLib for UserOperation;

    address public verifier;
    EntryPoint public entryPoint;
    AccountFactory public factory;

    function setUp() public {
        verifier = address(new P256Verifier());
        entryPoint = new EntryPoint();
        factory = new AccountFactory(entryPoint, verifier);
    }

    function testDeploy() public {
        // invalid signing key, irrelevant here
        bytes32[2] memory key1 = [bytes32(0), bytes32(0)];

        // deploy account
        Call[] memory calls = new Call[](0);
        DaimoAccount acc = factory.createAccount{value: 0}(0, key1, calls, 42);
        console.log("new account address:", address(acc));
        assertEq(acc.numActiveKeys(), uint8(1));

        // deploy again = just returns the existing address
        // prefund still goes thru to the entrypoint contract
        assertEq(entryPoint.getDepositInfo(address(acc)).deposit, 0);
        DaimoAccount acc2 = factory.createAccount{value: 9}(0, key1, calls, 42);
        assertEq(address(acc), address(acc2));
        assertEq(entryPoint.getDepositInfo(address(acc)).deposit, 9);

        // get the counterfactual address, should be same
        address counterfactual = factory.getAddress(0, key1, calls, 42);
        assertEq(address(acc), counterfactual);
    }
}
