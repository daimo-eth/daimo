// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/P256SHA256.sol";

contract P256SHA256Test is Test {
    P256SHA256 public verifier;

    function setUp() public {
        verifier = new P256SHA256();
    }

    function testTrivialVerify() public {
        // Test signature from swift-testing-playground
        bytes memory key = hex"761052180c3665204fc5c4312a28cd53bc2b1c013a2d8ea293d0c556790186a83ad45c65ff1c4809df7e1f807705dd3a9b04d3f9806717c061d38450833e0d76";
        bytes memory data = hex"48656c6c6f2c20706c617967726f756e64";
        bytes memory signature = hex"38fc4372726293377d9eb5a35cd521b9ddd603420735733979f06952c50fa08e300da1ce3f19e5f0fa90eabd473a2fd40bdb6cf3c37dc53bb07c82261c3d7be7";
        bool ret = verifier.verify(
            key,
            data,
            signature
        );
        assertTrue(ret);

        data = hex"deadbeef";
        ret = verifier.verify(
            key,
            data,
            signature
        );
        assertFalse(ret);
    }
}
