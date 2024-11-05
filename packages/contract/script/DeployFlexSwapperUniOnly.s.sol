// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {stdJson} from "forge-std/StdJson.sol";

import "../src/DaimoFlexSwapper.sol";
import "./Constants.s.sol";

using stdJson for string;

// Step 1: deploy this
// Step 2: use it to cross check chainlink feeds in @daimo/contract
// Step 3: use chainlink feeds to deploy the real DaimoFlexSwapper
contract DeployFlexSwapperUniOnlyScript is Script {
    IERC20[] _knownTokenAddrs;
    DaimoFlexSwapper.KnownToken[] private _knownTokens;

    function run() public {
        bytes memory initCall = _getInitCall();

        vm.startBroadcast();

        DaimoFlexSwapper implementation = new DaimoFlexSwapper{
            salt: bytes32(uint256(4))
        }();
        address swapper = CREATE3.deploy(
            keccak256("DaimoFlexSwapperUniOnly-4"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(address(implementation), initCall)
            )
        );
        console2.log("uniswap only swapper deployed at address:", swapper);

        vm.stopBroadcast();
    }

    function _getInitCall() private returns (bytes memory) {
        uint24[] memory oracleFeeTiers = new uint24[](4);
        oracleFeeTiers[0] = 100; // 0.01%
        oracleFeeTiers[1] = 500; // 0.05%
        oracleFeeTiers[2] = 3000; // 0.3%
        oracleFeeTiers[3] = 10000; // 1%

        uint32 oraclePeriod = 1 minutes;

        (
            IERC20 wrappedNative,
            IERC20[] memory hopTokens,
            IERC20[] memory outputTokens,
            address oraclePoolFactory,
            IERC20[] memory knownTokenAddrs,
            DaimoFlexSwapper.KnownToken[] memory knownTokens
        ) = _getAddrs(block.chainid);

        // initOwner = daimo.eth
        address initOwner = 0xEEee8B1371f1664b7C2A8c111D6062b6576fA6f0;

        return
            abi.encodeWithSelector(
                DaimoFlexSwapper.init.selector,
                initOwner,
                wrappedNative,
                hopTokens,
                outputTokens,
                oracleFeeTiers,
                oraclePeriod,
                oraclePoolFactory,
                knownTokenAddrs,
                knownTokens
            );
    }

    IERC20[] stablecoins;

    function _getAddrs(
        uint256 chainId
    )
        private
        returns (
            IERC20 wrappedNative,
            IERC20[] memory hopTokens,
            IERC20[] memory outputTokens,
            address oraclePoolFactory,
            IERC20[] memory knownTokenAddrs,
            DaimoFlexSwapper.KnownToken[] memory knownTokens
        )
    {
        wrappedNative = IERC20(_getWrappedNativeToken(chainId));
        IERC20 weth = IERC20(_getWETH(chainId));
        if (address(weth) != address(0) && weth != wrappedNative) {
            hopTokens = new IERC20[](2);
            hopTokens[0] = weth;
            hopTokens[1] = wrappedNative;
        } else {
            hopTokens = new IERC20[](1);
            hopTokens[0] = wrappedNative;
        }

        // USDC, bridged USDC and axlUSDC only
        if (_getUSDCAddress(chainId) != address(0)) {
            stablecoins.push(IERC20(_getUSDCAddress(chainId)));
        }
        if (_getBridgedUSDCAddress(chainId) != address(0)) {
            stablecoins.push(IERC20(_getBridgedUSDCAddress(chainId)));
        }
        if (_getAxlUsdcAddress(chainId) != address(0)) {
            stablecoins.push(IERC20(_getAxlUsdcAddress(chainId)));
        }

        // Supported output tokens (stablecoins + hopTokens)
        outputTokens = new IERC20[](stablecoins.length + hopTokens.length);
        for (uint256 i = 0; i < stablecoins.length; i++) {
            outputTokens[i] = stablecoins[i];
        }
        for (uint256 i = 0; i < hopTokens.length; i++) {
            outputTokens[i + stablecoins.length] = hopTokens[i];
        }

        oraclePoolFactory = _getUniswapFactoryAddress(chainId);

        // Add stablecoins + Chainlink data feed oracles
        knownTokenAddrs = new IERC20[](_knownTokens.length);
        knownTokens = new DaimoFlexSwapper.KnownToken[](_knownTokens.length);
        for (uint256 i = 0; i < _knownTokens.length; i++) {
            knownTokenAddrs[i] = _knownTokenAddrs[i];
            knownTokens[i] = _knownTokens[i];
        }
    }

    // Exclude from forge coverage
    function test() public {}
}
