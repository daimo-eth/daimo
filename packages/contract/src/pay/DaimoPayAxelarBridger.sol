// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IDaimoPayBridger.sol";
import "../../vendor/axelar/IAxelarGatewayWithToken.sol";

/// @title Bridger implementation for Axelar Protocol
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// @dev Bridges assets from to a destination chain using Axelar Protocol. Makes
/// the assumption that the local token is an ERC20 token and has a 1 to 1 price
/// with the corresponding destination token.
contract DaimoPayAxelarBridger is IDaimoPayBridger, Ownable2Step {
    using SafeERC20 for IERC20;
    using Strings for address;

    struct AxelarBridgeRoute {
        string destChainName;
        string tokenSymbol;
        address localTokenAddr;
        address receiverContract;
    }

    // AxelarGateway contract for this chain.
    IAxelarGatewayWithToken public immutable axelarGateway;

    // Mapping from destination chain and token to the corresponding token on
    // the current chain.
    mapping(uint256 toChainId => mapping(address toToken => AxelarBridgeRoute bridgeRoute))
        public bridgeRouteMapping;

    // event BridgeRouteAdded(
    //     uint256 indexed toChainId,
    //     address indexed toToken,
    //     string destChainName,
    //     string tokenSymbol,
    //     address localTokenAddr,
    //     uint256 fee
    // );
    // event BridgeRouteRemoved(
    //     uint256 indexed toChainId,
    //     address indexed toToken,
    //     string destChainName,
    //     string tokenSymbol,
    //     address localTokenAddr,
    //     uint256 fee
    // );

    /// Specify the localToken mapping to destination chains and tokens
    constructor(
        address _owner,
        IAxelarGatewayWithToken _axelarGateway,
        uint256[] memory _toChainIds,
        address[] memory _toTokens,
        AxelarBridgeRoute[] memory _bridgeRoutes
    ) Ownable(_owner) {
        axelarGateway = _axelarGateway;

        uint256 n = _toChainIds.length;
        require(n == _bridgeRoutes.length, "DPAxB: wrong bridgeRoutes length");

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
        AxelarBridgeRoute memory bridgeRoute
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
        AxelarBridgeRoute memory bridgeRoute
    ) private {
        bridgeRouteMapping[toChainId][toToken] = bridgeRoute;
        // emit BridgeRouteAdded({
        //     toChainId: toChainId,
        //     toToken: toToken,
        //     destChainName: bridgeRoute.destChainName,
        //     tokenSymbol: bridgeRoute.tokenSymbol,
        //     localTokenAddr: bridgeRoute.localTokenAddr,
        //     fee: bridgeRoute.fee
        // });
    }

    function removeBridgeRoute(
        uint256 toChainId,
        address toToken
    ) public onlyOwner {
        AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];
        delete bridgeRouteMapping[toChainId][toToken];
        // emit BridgeRouteRemoved({
        //     toChainId: toChainId,
        //     toToken: toToken,
        //     destChainName: bridgeRoute.destChainName,
        //     tokenSymbol: bridgeRoute.tokenSymbol,
        //     localTokenAddr: bridgeRoute.localTokenAddr,
        //     fee: bridgeRoute.fee
        // });
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
        AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];
        return (bridgeRoute.localTokenAddr, toAmount);
    }

    /// Initiate a bridge to a destination chain using Across Protocol.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata /* extraData */
    ) public {
        require(toChainId != block.chainid, "DPAxB: same chain");
        require(toAmount > 0, "DPAxB: zero amount");

        // Get the local token that corresponds to the destination token.
        (address inputToken, uint256 inputAmount) = getInputTokenAmount({
            toChainId: toChainId,
            toToken: toToken,
            toAmount: toAmount
        });

        AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];

        // Move input token from caller to this contract and approve the
        // AxelarGateway contract.
        IERC20(inputToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: inputAmount
        });
        IERC20(inputToken).forceApprove({
            spender: address(axelarGateway),
            value: inputAmount
        });

        axelarGateway.callContractWithToken(
            bridgeRoute.destChainName,
            bridgeRoute.receiverContract.toHexString(),
            abi.encode(toAddress),
            bridgeRoute.tokenSymbol,
            inputAmount
        );

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
