// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "forge-std/StdJson.sol";
import "../../src/DaimoUniswapOracle.sol";

using stdJson for string;

contract DaimoUniswapOracleTest is Test {
    DaimoUniswapOracle public oracle;

    function setUp() public {
        IERC20[] memory hopTokens = new IERC20[](1);

        hopTokens[0] = IERC20(0x4200000000000000000000000000000000000006);

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        oracle = new DaimoUniswapOracle({
            _usdc: IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913),
            _weth: IERC20(0x4200000000000000000000000000000000000006),
            _hopTokens: hopTokens,
            _oracleFeeTiers: oracleFeeTiers,
            _oraclePeriod: 1 minutes,
            _oraclePoolFactory: IUniswapV3Factory(
                0x33128a8fC17869897dcE68Ed026d694621f6FDfD
            )
        });

        assert(block.number == 14513720); // These tests are block number / chain config dependent
    }

    function testPools() public {
        string memory file = "./test/uniswap/data/uniswapPools.jsonl";

        while (true) {
            string memory query = vm.readLine(file);
            if (bytes(query).length == 0) break;

            IERC20 token0 = IERC20(query.readAddress(".token0"));
            IERC20 token1 = IERC20(query.readAddress(".token1"));
            address expectedPool = address(query.readAddress(".bestPool"));

            (address poolAddr, ) = oracle.getBestPoolTick(token0, token1);
            assertEq(poolAddr, expectedPool);
            (address revPoolAddr, ) = oracle.getBestPoolTick(token1, token0);
            assertEq(revPoolAddr, expectedPool);
        }
    }

    function testQuotes() public {
        string memory file = "./test/uniswap/data/uniswapQuotes.jsonl";

        while (true) {
            string memory query = vm.readLine(file);
            if (bytes(query).length == 0) break;

            IERC20 tokenIn = IERC20(query.readAddress(".tokenIn"));
            uint128 amountIn = uint128(query.readUint(".amountIn"));
            uint expectedOut = query.readUint(".expectedOut");

            uint amountOut = oracle.getUSDCQuote(amountIn, tokenIn);
            assertEq(amountOut / 10 ** 4, expectedOut / 10 ** 4); // matches in cents
        }
    }
}
