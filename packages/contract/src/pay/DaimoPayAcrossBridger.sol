// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IDaimoPayBridger.sol";
import "../../vendor/across/V3SpokePoolInterface.sol";

/// @title Bridger implementation for Across Protocol
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// @dev Bridges assets from to a destination chain using Across Protocol. Makes the
/// assumption that the local token is an ERC20 token and has a 1 to 1 price
/// with the corresponding destination token.
contract DaimoPayAcrossBridger is IDaimoPayBridger, Ownable2Step {
    using SafeERC20 for IERC20;

    struct AcrossBridgeRoute {
        address localToken;
        // Minimum percentage fee to pay the Across relayer. The input amount should
        // be at least this much larger than the output amount
        // 1% is represented as 1e16, 100% is 1e18, 50% is 5e17. This is how Across
        // represents percentage fees.
        uint256 pctFee;
        // Minimum flat fee to pay the Across relayer. The input amount should be at
        // least this much larger than the output amount
        uint256 flatFee;
    }

    struct ExtraData {
        address exclusiveRelayer;
        uint32 quoteTimestamp;
        uint32 fillDeadline;
        uint32 exclusivityDeadline;
        bytes message;
    }

    uint256 public immutable ONE_HUNDRED_PERCENT = 1e18;

    // SpokePool contract address for this chain.
    V3SpokePoolInterface public immutable spokePool;

    // Mapping from destination chain and token to the corresponding token on
    // the current chain.
    mapping(uint256 toChainId => mapping(address toToken => AcrossBridgeRoute bridgeRoute))
        public bridgeRouteMapping;

    event BridgeRouteAdded(
        uint256 indexed toChainId,
        address indexed toToken,
        address indexed localToken,
        uint256 pctFee
    );
    event BridgeRouteRemoved(
        uint256 indexed toChainId,
        address indexed toToken,
        address indexed localToken,
        uint256 pctFee
    );

    /// Specify the localToken mapping to destination chains and tokens
    constructor(
        address _owner,
        V3SpokePoolInterface _spokePool,
        uint256[] memory _toChainIds,
        address[] memory _toTokens,
        AcrossBridgeRoute[] memory _bridgeRoutes
    ) Ownable(_owner) {
        spokePool = _spokePool;

        uint256 n = _toChainIds.length;
        require(n == _bridgeRoutes.length, "DPAB: wrong bridgeRoutes length");

        for (uint256 i = 0; i < n; ++i) {
            _addBridgeRoute({
                toChainId: _toChainIds[i],
                toToken: _toTokens[i],
                bridgeRoute: _bridgeRoutes[i]
            });
        }
    }

    // ----- ADMIN FUNCTIONS -----

    /// Map a token on a destination chain to a token on the current chain.
    /// Assumes the local token has a 1 to 1 price with the corresponding
    /// destination token.
    function addBridgeRoute(
        uint256 toChainId,
        address toToken,
        AcrossBridgeRoute memory bridgeRoute
    ) public onlyOwner {
        _addBridgeRoute({
            toChainId: toChainId,
            toToken: toToken,
            bridgeRoute: bridgeRoute
        });
    }

    function _addBridgeRoute(
        uint256 toChainId,
        address toToken,
        AcrossBridgeRoute memory bridgeRoute
    ) private {
        bridgeRouteMapping[toChainId][toToken] = bridgeRoute;
        emit BridgeRouteAdded({
            toChainId: toChainId,
            toToken: toToken,
            localToken: bridgeRoute.localToken,
            pctFee: bridgeRoute.pctFee
        });
    }

    function removeBridgeRoute(
        uint256 toChainId,
        address toToken
    ) public onlyOwner {
        AcrossBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];
        delete bridgeRouteMapping[toChainId][toToken];
        emit BridgeRouteRemoved({
            toChainId: toChainId,
            toToken: toToken,
            localToken: bridgeRoute.localToken,
            pctFee: bridgeRoute.pctFee
        });
    }

    // ----- BRIDGING FUNCTIONS -----

    /// Get the local token that corresponds to the destination token. Get the
    /// minimum input amount for a given output amount. The input amount must
    /// cover the max of the percentage fee and the flat fee.
    function getInputTokenAmount(
        uint256 toChainId,
        address toToken,
        uint256 toAmount
    ) public view returns (address inputToken, uint256 inputAmount) {
        AcrossBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];
        require(
            bridgeRoute.localToken != address(0),
            "DPAB: bridge route not found"
        );

        inputToken = bridgeRoute.localToken;

        uint256 amtWithPctFee = (toAmount *
            (ONE_HUNDRED_PERCENT + bridgeRoute.pctFee)) / ONE_HUNDRED_PERCENT;
        uint256 amtWithFlatFee = toAmount + bridgeRoute.flatFee;

        // Return the larger of the two amounts
        inputAmount = amtWithPctFee > amtWithFlatFee
            ? amtWithPctFee
            : amtWithFlatFee;
    }

    /// Initiate a bridge to a destination chain using Across Protocol.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata extraData
    ) public {
        require(toChainId != block.chainid, "DPAB: same chain");
        require(toAmount > 0, "DPAB: zero amount");

        // Get the local token that corresponds to the destination token.
        (address inputToken, uint256 inputAmount) = getInputTokenAmount({
            toChainId: toChainId,
            toToken: toToken,
            toAmount: toAmount
        });

        // Parse remaining arguments from extraData
        ExtraData memory extra;
        extra = abi.decode(extraData, (ExtraData));

        // Move input token from caller to this contract and approve the
        // SpokePool contract.
        IERC20(inputToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: inputAmount
        });
        IERC20(inputToken).forceApprove({
            spender: address(spokePool),
            value: inputAmount
        });

        spokePool.depositV3({
            depositor: address(this),
            recipient: toAddress,
            inputToken: inputToken,
            outputToken: toToken,
            inputAmount: inputAmount,
            outputAmount: toAmount,
            destinationChainId: toChainId,
            exclusiveRelayer: extra.exclusiveRelayer,
            quoteTimestamp: extra.quoteTimestamp,
            fillDeadline: extra.fillDeadline,
            exclusivityDeadline: extra.exclusivityDeadline,
            message: extra.message
        });

        emit BridgeInitiated({
            fromAddress: msg.sender,
            fromToken: inputToken,
            fromAmount: inputAmount,
            toChainId: toChainId,
            toAddress: toAddress,
            toToken: toToken,
            toAmount: toAmount
        });
    }
}
