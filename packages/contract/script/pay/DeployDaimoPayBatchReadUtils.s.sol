// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "../../src/pay/DaimoPayBatchReadUtils.sol";
import "../Constants.s.sol";

contract DeployDaimoPayBatchReadUtils is Script {
    function run() public {
        vm.startBroadcast();

        address owner = tx.origin;
        address quoteToken = _getQuoteToken(block.chainid);
        uint128 quoteAmount = _getQuoteAmount(block.chainid);
        address dfs = _getFlexSwapperAddress(block.chainid);

        console.log("owner:", owner);
        console.log("quoteToken:", quoteToken);
        console.log("quoteAmount:", quoteAmount);
        console.log("dfs:", dfs);

        address daimoPayBatchReadUtils = CREATE3.deploy(
            keccak256("DaimoPayBatchReadUtils-test5"),
            abi.encodePacked(
                type(DaimoPayBatchReadUtils).creationCode,
                abi.encode(owner, quoteToken, quoteAmount, dfs)
            )
        );

        vm.stopBroadcast();

        console.log(
            "daimo pay batch read utils deployed at address:",
            daimoPayBatchReadUtils
        );
    }

    function _getQuoteToken(uint256 chainId) internal pure returns (address) {
        if (chainId == LINEA_MAINNET) {
            return LINEA_MAINNET_BRIDGED_USDC;
        } else if (chainId == BSC_MAINNET) {
            return BSC_MAINNET_BRIDGED_USDC;
        } else {
            return _getUSDCAddress(chainId);
        }
    }

    function _getQuoteAmount(uint256 chainId) internal pure returns (uint128) {
        // 10,000 USDC
        if (chainId == BSC_MAINNET) {
            return 10_000_000_000_000_000_000_000; // BSC USDC has 18 decimals
        } else {
            return 10_000_000_000; // Other chains have 6 decimals
        }
    }

    function _getFlexSwapperAddress(
        uint256 chainId
    ) internal pure returns (address) {
        if (chainId == ETH_MAINNET) {
            return 0x207e87f84cff325715f324d09E63b21a03E53b61;
        } else {
            return 0xA9F5d58edb8dF8af90f875eac89AA49C57b87Db8;
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
