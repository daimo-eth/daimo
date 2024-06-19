// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoUSDCSwapper.sol";

import {CREATE3Factory} from "create3-factory/src/CREATE3Factory.sol";

// Uniswap Base Deployments Reference:
// https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments

contract DeployDaimoUSDCSwapper is Script {
  CREATE3Factory _create3 =
    CREATE3Factory(0x9fBB3DF7C40Da2e5A0dE984fFE2CCB7C47cd0ABf);

  function runBase() public {
    IERC20 usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 weth = IERC20(0x4200000000000000000000000000000000000006);

    IERC20[] memory hopTokens = new IERC20[](1);

    hopTokens[0] = IERC20(0x4200000000000000000000000000000000000006);

    ISwapRouter uniswapRouter = ISwapRouter(
      0x2626664c2603336E57B271c5C0b26F421741e481
    );

    uint24[] memory oracleFeeTiers = new uint24[](4);
    oracleFeeTiers[0] = 100;
    oracleFeeTiers[1] = 500;
    oracleFeeTiers[2] = 3000;
    oracleFeeTiers[3] = 10000;

    uint32 oraclePeriod = 1 minutes;
    IUniswapV3Factory oraclePoolFactory = IUniswapV3Factory(
      0x33128a8fC17869897dcE68Ed026d694621f6FDfD
    );

    IQuoterV2 uniswapQuoter = IQuoterV2(
      0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a
    );

    vm.startBroadcast();

    DaimoUSDCSwapper swapper = DaimoUSDCSwapper(
      _create3.deploy(
        keccak256("DaimoUSDCSwapper-testing-5"),
        bytes.concat(
          type(DaimoUSDCSwapper).creationCode,
          abi.encode(
            usdc,
            weth,
            hopTokens,
            uniswapRouter,
            uniswapQuoter,
            oracleFeeTiers,
            oraclePeriod,
            oraclePoolFactory
          )
        )
      )
    );

    console2.log("deployed at", address(swapper));

    vm.stopBroadcast();
  }
}
