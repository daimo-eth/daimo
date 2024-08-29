// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "forge-std/StdJson.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../../src/DaimoFlexSwapper.sol";

using stdJson for string;

contract DaimoUniswapOracleTest is Test {
    DaimoFlexSwapper public swapper;

    function setUp() public {
        IERC20[] memory hopTokens = new IERC20[](1);
        IERC20 weth = IERC20(0x4200000000000000000000000000000000000006);
        hopTokens[0] = weth;

        IERC20[] memory outputTokens = new IERC20[](1);
        outputTokens[0] = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        address swapperImpl = address(new DaimoFlexSwapper());
        swapper = DaimoFlexSwapper(address(new ERC1967Proxy(swapperImpl, "")));

        swapper.init({
            _initialOwner: address(this),
            _wrappedNativeToken: weth,
            _hopTokens: hopTokens,
            _outputTokens: outputTokens,
            _oracleFeeTiers: oracleFeeTiers,
            _oraclePeriod: 1 minutes,
            _oraclePoolFactory: IUniswapV3Factory(
                0x33128a8fC17869897dcE68Ed026d694621f6FDfD
            ),
            _knownTokenAddrs: new IERC20[](0),
            _knownTokens: new DaimoFlexSwapper.KnownToken[](0)
        });

        assert(block.number == 14513720); // These tests are block number / chain config dependent
    }

    function testPools() public view {
        string memory file = "./test/uniswap/data/uniswapPools.jsonl";

        while (true) {
            string memory query = vm.readLine(file);
            if (bytes(query).length == 0) break;

            IERC20 token0 = IERC20(query.readAddress(".token0"));
            IERC20 token1 = IERC20(query.readAddress(".token1"));
            address expectedPool = address(query.readAddress(".bestPool"));

            (address poolAddr, , , ) = swapper.getBestPoolTick(
                token0,
                1,
                token1
            );
            assertEq(poolAddr, expectedPool);
            (address revPoolAddr, , , ) = swapper.getBestPoolTick(
                token1,
                1,
                token0
            );
            assertEq(revPoolAddr, expectedPool);
        }
    }

    function testQuotes() public view {
        string memory file = "./test/uniswap/data/uniswapQuotes.jsonl";

        while (true) {
            string memory query = vm.readLine(file);
            if (bytes(query).length == 0) break;

            IERC20 tokenIn = IERC20(query.readAddress(".tokenIn"));
            uint128 amountIn = uint128(query.readUint(".amountIn"));
            uint256 expectedOut = query.readUint(".expectedOut");
            IERC20 baseUSDC = IERC20(
                0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
            );

            (uint256 amountOut, ) = swapper.quote(tokenIn, amountIn, baseUSDC);
            assertEq(amountOut / 10 ** 4, expectedOut / 10 ** 4); // matches in cents
        }
    }
}
