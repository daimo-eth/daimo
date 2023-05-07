// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/P256SHA256.sol";

contract P256SHA256Test is Test {
    P256SHA256 public verifier;

    function setUp() public {
        verifier = new P256SHA256();
    }

    function testTrivialVerify() public {
        // Test signature from swift-testing-playground
        bytes memory key = hex"65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e44a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437";
        bytes32 data = hex"dd0a63366691cce64d119a175ee05701a1ca42ec9bc0146c1c4815d97dcbdce6";
        bytes memory prefixedData = bytes.concat("\x19Ethereum Signed Message:\n32", data);
        bytes memory signature = hex"93dfb3f8d2af9e0f55067293dfcae5ae1bd480e6f8afd2617d160978511bb216a2ed2f7f77d9a7e8ff44bc47a4d8f6aee50340cc01dbb0843c39562dfa0d9ed5";
        bool ret = verifier.verify(
            key,
            prefixedData,
            signature
        );
        assertTrue(ret);

        data = hex"deadbeef";
        prefixedData = bytes.concat("\x19Ethereum Signed Message:\n32", data);
        ret = verifier.verify(
            key,
            prefixedData,
            signature
        );
        assertFalse(ret);
    }
}
