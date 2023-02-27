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
        bytes memory key = hex"0101030d1a88c88615d437fbb8bf9e1942a1929f28562706ae6c2bd399e7b1bfb6d1e9e75b92b4aa42917ae1c61b701ef035c3fe7be3009cbafe5a2f71316c902dcf0d00";
        bytes memory data = hex"00010d0300000e104c88b1374c63c737d960076578616d706c65036e65740003777777076578616d706c65036e6574000001000100000e100004c0000201";
        bytes memory signature = hex"ab1eb02d8aa687e97da0229337aa8873e6f0eb26be289f28333d183f5d3b7a95c0c869adfb748daee3c5286eed6682c12e5533186baced9c26c167a9ebae950b";
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
