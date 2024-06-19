// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../../src/DaimoUSDCSwapper.sol";

// Test onchain route-finder and quoter.
contract QuoterTest is Test {
  IERC20 public tokenIn;
  IERC20 public usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
  IERC20 public weth = IERC20(0x4200000000000000000000000000000000000006);
  DaimoUSDCSwapper public swapper;
  uint256 private constant _DIRECT_ROUTE_SWAP_LENGTH = 43;

  function setUp() public {
    IERC20[] memory hopTokens = new IERC20[](1);

    hopTokens[0] = weth;

    uint24[] memory oracleFeeTiers = new uint24[](4);
    oracleFeeTiers[0] = 100;
    oracleFeeTiers[1] = 500;
    oracleFeeTiers[2] = 3000;
    oracleFeeTiers[3] = 10000;

    swapper = new DaimoUSDCSwapper({
      _usdc: usdc,
      _weth: weth,
      _hopTokens: hopTokens,
      _uniswapRouter: ISwapRouter(0x2626664c2603336E57B271c5C0b26F421741e481),
      _oracleFeeTiers: oracleFeeTiers,
      _oraclePeriod: 1 minutes,
      _oraclePoolFactory: IUniswapV3Factory(
        0x33128a8fC17869897dcE68Ed026d694621f6FDfD
      )
    });

    assert(block.number == 15950101); // Block specific test
  }

  function testUSDCSwapperQuote() public {
    tokenIn = IERC20(0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb); // DAI
    uint128 amountIn = 15990000000000000000000; // $15,990 DAI

    (, bytes memory swapPath) = swapper.quote(amountIn, tokenIn, usdc);

    // Quoter should return the direct route.
    (address tokenInAddress, address tokenOutAddress, uint24 fee) = Path
      .decodeFirstPool(swapPath);

    assertEq(tokenInAddress, address(tokenIn));
    assertEq(tokenOutAddress, address(usdc));
    assertEq(fee, 100);
    assertEq(swapPath.length, _DIRECT_ROUTE_SWAP_LENGTH); // direct route swap path length
  }
}
