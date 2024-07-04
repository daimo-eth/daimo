// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DaimoFlexSwapper.sol";
import "./Constants.s.sol";

import {CREATE3Factory} from "create3-factory/src/CREATE3Factory.sol";

contract DeployDaimoFlexSwapper is Script {
    // Note: create3 factory is only deployed on some testnets.
    CREATE3Factory _create3 =
        CREATE3Factory(0x9fBB3DF7C40Da2e5A0dE984fFE2CCB7C47cd0ABf);

    function run() public {
        uint256 chainId = block.chainid;

        // TODO: change to get correct WETH address per chain. For now, just OPStack.
        require(
            chainId == BASE_MAINNET ||
                chainId == BASE_TESTNET ||
                chainId == OP_MAINNET ||
                chainId == OP_TESTNET
        );
        IERC20 weth = IERC20(0x4200000000000000000000000000000000000006);
        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        // Supported output tokens
        IERC20 usdc = IERC20(_getUSDCAddress(chainId));
        IERC20[] memory outputTokens = new IERC20[](1);
        outputTokens[0] = usdc;

        address uniswapRouter = _getUniswapSwapRouterAddress(chainId);

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

        DaimoFlexSwapper swapper = DaimoFlexSwapper(
            _create3.deploy(
                keccak256("DaimoFlexSwapper-5"),
                bytes.concat(
                    type(DaimoFlexSwapper).creationCode,
                    abi.encode(
                        weth,
                        hopTokens,
                        outputTokens,
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

    function test() public {
        IERC20 weth = IERC20(0x4200000000000000000000000000000000000006);
        IERC20[] memory hopTokens = new IERC20[](1);
        hopTokens[0] = weth;

        // Supported output tokens
        IERC20 usdc = IERC20(_getUSDCAddress(block.chainid));
        IERC20[] memory outputTokens = new IERC20[](1);
        outputTokens[0] = usdc;

        address uniswapRouter = _getUniswapSwapRouterAddress(block.chainid);

        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        uint32 oraclePeriod = 1 minutes;
        IUniswapV3Factory oraclePoolFactory = IUniswapV3Factory(
            _getUniswapFactoryAddress(block.chainid)
        );

        DaimoFlexSwapper swapper = new DaimoFlexSwapper(
            weth,
            hopTokens,
            outputTokens,
            uniswapRouter,
            oracleFeeTiers,
            oraclePeriod,
            oraclePoolFactory
        );
        address tokenIn = 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed; // DEGEN
        uint256 amountIn = 200 * 1e18;
        address tokenOut = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // USDC

        IERC20(tokenIn).approve(address(swapper), amountIn);
        swapper.swapToCoin(IERC20(tokenIn), amountIn, IERC20(tokenOut), "");
    }
}
