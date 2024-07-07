// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "../src/DaimoFlexSwapper.sol";
import "./Constants.s.sol";

contract DeployFlexSwapperScript is Script {
    function run() public {
        uint256 chainId = block.chainid;

        IERC20 wrappedNative = IERC20(_getWrappedNativeToken(chainId));
        IERC20 weth = IERC20(_getWETH(chainId));
        IERC20[] memory hopTokens;
        if (weth == wrappedNative) {
            hopTokens = new IERC20[](1);
            hopTokens[0] = weth;
        } else {
            hopTokens = new IERC20[](2);
            hopTokens[0] = weth;
            hopTokens[1] = wrappedNative;
        }

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
            CREATE3.deploy(
                keccak256("DaimoFlexSwapper-6"),
                bytes.concat(
                    type(DaimoFlexSwapper).creationCode,
                    abi.encode(
                        wrappedNative,
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

    // Exclude from forge coverage
    function test() public {}
}
