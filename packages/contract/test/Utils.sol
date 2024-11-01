// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "p256-verifier/utils/Base64URL.sol";

library Utils {
    function packAccountGasLimits(
        uint128 verificationGasLimit,
        uint128 callGasLimit
    ) public pure returns (bytes32) {
        return packHiLo(verificationGasLimit, callGasLimit);
    }

    function packGasFees(
        uint128 maxPriorityFeePerGas,
        uint128 maxFeePerGas
    ) public pure returns (bytes32) {
        return packHiLo(maxPriorityFeePerGas, maxFeePerGas);
    }

    function packPaymasterAndData(
        address paymaster,
        uint128 validationGasLimit,
        uint128 postOpGasLimit,
        bytes memory data
    ) public pure returns (bytes memory) {
        return
            abi.encodePacked(
                paymaster,
                validationGasLimit,
                postOpGasLimit,
                data
            );
    }

    function packHiLo(uint128 hi, uint128 lo) public pure returns (bytes32) {
        return bytes32((uint256(hi) << 128) | uint256(lo));
    }
}
