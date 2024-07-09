// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/DaimoFlexSwapper.sol";
import "./Constants.s.sol";

contract DeployFlexSwapperScript is Script {
    function run() public {
        bytes memory initCall = _getInitCall();

        vm.startBroadcast();

        DaimoFlexSwapper implementation = new DaimoFlexSwapper{salt: 0}();
        address swapper = CREATE3.deploy(
            keccak256("DaimoFlexSwapper-9"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(address(implementation), initCall)
            )
        );
        console2.log("swapper deployed at address:", swapper);

        vm.stopBroadcast();
    }

    function _getInitCall() private view returns (bytes memory) {
        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100;
        oracleFeeTiers[1] = 500;
        oracleFeeTiers[2] = 3000;
        oracleFeeTiers[3] = 10000;

        uint32 oraclePeriod = 1 minutes;

        (
            IERC20 wrappedNative,
            IERC20[] memory hopTokens,
            IERC20[] memory outputTokens,
            IERC20[] memory stablecoins,
            address uniswapRouter,
            address oraclePoolFactory
        ) = _getAddrs(block.chainid);

        return
            abi.encodeWithSelector(
                DaimoFlexSwapper.init.selector,
                address(this) /* initialOwner */,
                wrappedNative,
                hopTokens,
                outputTokens,
                stablecoins,
                uniswapRouter,
                oracleFeeTiers,
                oraclePeriod,
                oraclePoolFactory
            );
    }

    function _getAddrs(
        uint256 chainId
    )
        private
        pure
        returns (
            IERC20 wrappedNative,
            IERC20[] memory hopTokens,
            IERC20[] memory outputTokens,
            IERC20[] memory stablecoins,
            address uniswapRouter,
            address oraclePoolFactory
        )
    {
        wrappedNative = IERC20(_getWrappedNativeToken(chainId));
        IERC20 weth = IERC20(_getWETH(chainId));
        if (weth == wrappedNative) {
            hopTokens = new IERC20[](1);
            hopTokens[0] = weth;
        } else {
            hopTokens = new IERC20[](2);
            hopTokens[0] = weth;
            hopTokens[1] = wrappedNative;
        }

        // Stablecoins
        IERC20 usdc = IERC20(_getUSDCAddress(chainId));
        IERC20 dai = IERC20(_getDAIAddress(chainId));
        IERC20 usdt = IERC20(_getUSDTAddress(chainId));

        if (_isTestnet(chainId)) {
            // There is no swapping liquidity on testnets so no need for
            // stablecoin options.
            stablecoins = new IERC20[](1);
            stablecoins[0] = usdc;
        } else if (_isL1(chainId)) {
            // No bridged USDC on L1
            stablecoins = new IERC20[](3);
            stablecoins[0] = usdc;
            stablecoins[1] = usdt;
            stablecoins[2] = dai;
        } else {
            IERC20 bridgedUsdc = IERC20(_getBridgedUSDCAddress(chainId));

            stablecoins = new IERC20[](4);
            stablecoins[0] = usdc;
            stablecoins[1] = usdt;
            stablecoins[2] = dai;
            stablecoins[3] = bridgedUsdc;
        }

        // Supported output tokens (stablecoins + hopTokens)
        outputTokens = new IERC20[](stablecoins.length + hopTokens.length);
        for (uint256 i = 0; i < stablecoins.length; i++) {
            outputTokens[i] = stablecoins[i];
        }
        for (uint256 i = 0; i < hopTokens.length; i++) {
            outputTokens[i + stablecoins.length] = hopTokens[i];
        }

        uniswapRouter = _getUniswapSwapRouterAddress(chainId);

        oraclePoolFactory = _getUniswapFactoryAddress(chainId);
    }

    // Exclude from forge coverage
    function test() public {}
}
