// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {stdJson} from "forge-std/StdJson.sol";

import "../src/DaimoFlexSwapper.sol";
import "./Constants.s.sol";

using stdJson for string;

contract DeployFlexSwapperScript is Script {
    IERC20[] _knownTokenAddrs;
    DaimoFlexSwapper.KnownToken[] private _knownTokens;

    function run() public {
        _loadKnownTokens();
        bytes memory initCall = _getInitCall();

        vm.startBroadcast();

        DaimoFlexSwapper implementation = new DaimoFlexSwapper{
            salt: bytes32(uint256(17))
        }();
        address swapper = CREATE3.deploy(
            keccak256("DaimoFlexSwapper-17"),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(address(implementation), initCall)
            )
        );
        console2.log("swapper (with feeds) deployed at address:", swapper);

        vm.stopBroadcast();
    }

    function _loadKnownTokens() private {
        IERC20 usdc = IERC20(_getUSDCAddress(block.chainid));
        IERC20 dai = IERC20(_getDAIAddress(block.chainid));
        IERC20 usdt = IERC20(_getUSDTAddress(block.chainid));
        IERC20 bridgedUsdc = IERC20(_getBridgedUSDCAddress(block.chainid));
        IERC20 axlUsdc = IERC20(_getAxlUsdcAddress(block.chainid));

        // Add priced tokens with Chainlink feeds
        string memory file = "./script/data/chainlink-feeds.jsonl";
        while (true) {
            string memory vector = vm.readLine(file);
            if (bytes(vector).length == 0) {
                break;
            }

            uint256 chainId = uint256(vector.readUint(".chainId"));
            address tokenAddr = vector.readAddress(".tokenAddress");
            address feedAddr = vector.readAddress(".chainlinkFeedAddress");
            bool skipUniswap = vector.readBool(".skipUniswap");

            if (chainId != block.chainid) {
                continue;
            }

            bool isStablecoin = tokenAddr == address(usdc) ||
                tokenAddr == address(dai) ||
                tokenAddr == address(usdt) ||
                tokenAddr == address(bridgedUsdc) ||
                tokenAddr == address(axlUsdc);
            if (isStablecoin) {
                continue;
            }

            DaimoFlexSwapper.KnownToken memory knownToken = DaimoFlexSwapper
                .KnownToken({
                    chainlinkFeedAddr: AggregatorV2V3Interface(feedAddr),
                    skipUniswap: skipUniswap,
                    isStablecoin: false
                });

            // Add to storage
            _knownTokenAddrs.push(IERC20(tokenAddr));
            _knownTokens.push(knownToken);
        }
        uint256 numChainlinkTokens = _knownTokens.length;

        // Add known good stablecoins
        if (usdc != IERC20(address(0))) {
            _knownTokenAddrs.push(usdc);
        }
        if (dai != IERC20(address(0))) {
            _knownTokenAddrs.push(dai);
        }
        if (usdt != IERC20(address(0))) {
            _knownTokenAddrs.push(usdt);
        }
        if (bridgedUsdc != IERC20(address(0))) {
            _knownTokenAddrs.push(bridgedUsdc);
        }
        if (axlUsdc != IERC20(address(0))) {
            _knownTokenAddrs.push(axlUsdc);
        }
        require(_knownTokenAddrs.length > 0, "No known tokens");
        for (uint256 i = numChainlinkTokens; i < _knownTokenAddrs.length; i++) {
            DaimoFlexSwapper.KnownToken memory knownToken = DaimoFlexSwapper
                .KnownToken({
                    chainlinkFeedAddr: AggregatorV2V3Interface(address(0)),
                    skipUniswap: false,
                    isStablecoin: true
                });
            _knownTokens.push(knownToken);
        }
    }

    function _getInitCall() private returns (bytes memory) {
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

        // Stablecoins
        if (_getUSDCAddress(chainId) != address(0)) {
            stablecoins.push(IERC20(_getUSDCAddress(chainId)));
        }
        if (_getUSDTAddress(chainId) != address(0)) {
            stablecoins.push(IERC20(_getUSDTAddress(chainId)));
        }
        if (_getDAIAddress(chainId) != address(0)) {
            stablecoins.push(IERC20(_getDAIAddress(chainId)));
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
