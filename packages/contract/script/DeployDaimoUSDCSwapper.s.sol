// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoUSDCSwapper.sol";
import "./Constants.s.sol";

import {CREATE3Factory} from "create3-factory/src/CREATE3Factory.sol";

contract DeployDaimoUSDCSwapper is Script {
    // Note: create3 factory is only deployed on some testnets.
    CREATE3Factory _create3 =
        CREATE3Factory(0x9fBB3DF7C40Da2e5A0dE984fFE2CCB7C47cd0ABf);

    function run() public {
        uint256 chainId = block.chainid;
        IERC20 usdc = IERC20(_getUSDCAddress(chainId));
        // TODO: change to get correct WETH address per chain.
        IERC20 weth = IERC20(0x4200000000000000000000000000000000000006);

        IERC20[] memory hopTokens = new IERC20[](1);

        hopTokens[0] = IERC20(0x4200000000000000000000000000000000000006);

        ISwapRouter uniswapRouter = ISwapRouter(
            _getUniswapSwapRouterAddress(chainId)
        );

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        uint32 oraclePeriod = 1 minutes;
        IUniswapV3Factory oraclePoolFactory = IUniswapV3Factory(
            _getUniswapFactoryAddress(chainId)
        );

        vm.startBroadcast();

        DaimoUSDCSwapper swapper = DaimoUSDCSwapper(
            _create3.deploy(
                keccak256("DaimoUSDCSwapper-testing-3"),
                bytes.concat(
                    type(DaimoUSDCSwapper).creationCode,
                    abi.encode(
                        usdc,
                        weth,
                        hopTokens,
                        uniswapRouter,
                        oracleFeeTiers,
                        oraclePeriod,
                        oraclePoolFactory
                    )
                )
            )
        );

        console2.log("swapper deployed at address:", address(swapper));

        vm.stopBroadcast();
    }
}
