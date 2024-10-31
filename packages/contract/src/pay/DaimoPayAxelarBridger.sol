// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import {AxelarExpressExecutableWithToken} from "@axelar-network/contracts/express/AxelarExpressExecutableWithToken.sol";
import {IAxelarGatewayWithToken} from "@axelar-network/contracts/interfaces/IAxelarGatewayWithToken.sol";
import {IAxelarGasService} from "@axelar-network/contracts/interfaces/IAxelarGasService.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IDaimoPayBridger.sol";

/// @title Bridger implementation for Axelar Protocol
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// @dev Bridges assets from to a destination chain using Axelar Protocol. Makes
/// the assumption that the local token is an ERC20 token and has a 1 to 1 price
/// with the corresponding destination token.
contract DaimoPayAxelarBridger is
    IDaimoPayBridger,
    AxelarExpressExecutableWithToken,
    Ownable2Step
{
    using SafeERC20 for IERC20;
    using Strings for address;

    struct AxelarBridgeRoute {
        string destChainName;
        string tokenSymbol;
        address localTokenAddr;
        address receiverContract;
        // Fee to be paid in native token for Axelar's bridging gas fee
        uint256 fee;
    }

    // Axelar contracts for this chain.
    IAxelarGatewayWithToken public immutable axelarGateway;
    IAxelarGasService public immutable axelarGasService;

    // Mapping from destination chain and token to the corresponding token on
    // the current chain.
    mapping(uint256 toChainId => mapping(address toToken => AxelarBridgeRoute bridgeRoute))
        public bridgeRouteMapping;

    event BridgeRouteAdded(
        uint256 indexed toChainId,
        address indexed toToken,
        string destChainName,
        string tokenSymbol,
        address localTokenAddr,
        address receiverContract,
        uint256 fee
    );

    event BridgeRouteRemoved(
        uint256 indexed toChainId,
        address indexed toToken,
        string destChainName,
        string tokenSymbol,
        address localTokenAddr,
        address receiverContract,
        uint256 fee
    );

    /// Specify the localToken mapping to destination chains and tokens
    constructor(
        address _owner,
        IAxelarGatewayWithToken _axelarGateway,
        IAxelarGasService _axelarGasService,
        uint256[] memory _toChainIds,
        address[] memory _toTokens,
        AxelarBridgeRoute[] memory _bridgeRoutes
    )
        Ownable(_owner)
        AxelarExpressExecutableWithToken(address(_axelarGateway))
    {
        axelarGateway = _axelarGateway;
        axelarGasService = _axelarGasService;

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
        emit BridgeRouteAdded({
            toChainId: toChainId,
            toToken: toToken,
            destChainName: bridgeRoute.destChainName,
            tokenSymbol: bridgeRoute.tokenSymbol,
            localTokenAddr: bridgeRoute.localTokenAddr,
            receiverContract: bridgeRoute.receiverContract,
            fee: bridgeRoute.fee
        });
    }

    function removeBridgeRoute(
        uint256 toChainId,
        address toToken
    ) public onlyOwner {
        AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];
        delete bridgeRouteMapping[toChainId][toToken];
        emit BridgeRouteRemoved({
            toChainId: toChainId,
            toToken: toToken,
            destChainName: bridgeRoute.destChainName,
            tokenSymbol: bridgeRoute.tokenSymbol,
            localTokenAddr: bridgeRoute.localTokenAddr,
            receiverContract: bridgeRoute.receiverContract,
            fee: bridgeRoute.fee
        });
    }

    // ----- AXELAR EXECUTABLE FUNCTIONS -----

    /// Part of the AxelarExpressExecutableWithToken interface. Used to make
    /// a contract call on the destination chain without tokens. Not supported
    /// by this implementation because we will always be bridging tokens.
    function _execute(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes calldata /* payload */
    ) internal pure override {
        revert("DPAxB: _execute not supported");
    }

    /// Part of the AxelarExpressExecutableWithToken interface. Used to make
    /// a contract call on the destination chain with tokens. Will always be
    /// used to transfer tokens to the intent address on the destination chain.
    function _executeWithToken(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        address recipient = abi.decode(payload, (address));
        address tokenAddress = axelarGateway.tokenAddresses(tokenSymbol);

        IERC20(tokenAddress).safeTransfer(recipient, amount);
    }

    // ----- BRIDGING FUNCTIONS -----

    /// Get the local token that corresponds to the destination token.
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

    /// Initiate a bridge to a destination chain using Axelar Protocol.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata extraData
    ) public {
        require(toChainId != block.chainid, "DPAxB: same chain");
        require(toAmount > 0, "DPAxB: zero amount");

        address refundAddress = abi.decode(extraData, (address));

        // Get the local token that corresponds to the destination token.
        (address inputToken, uint256 inputAmount) = getInputTokenAmount({
            toChainId: toChainId,
            toToken: toToken,
            toAmount: toAmount
        });

        AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId][
            toToken
        ];

        // Move input token from caller to this contract
        IERC20(inputToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: inputAmount
        });

        // Pay for Axelar's bridging gas fee.
        axelarGasService.payNativeGasForContractCallWithToken{
            value: bridgeRoute.fee
        }(
            address(this),
            bridgeRoute.destChainName,
            bridgeRoute.receiverContract.toHexString(),
            abi.encode(toAddress),
            bridgeRoute.tokenSymbol,
            toAmount,
            refundAddress
        );

        // Approve the AxelarGateway contract and initiate the bridge. Send the
        // tokens to the DaimoPayAxelarBridger on the destination chain. The
        // _executeWithToken function will be called on the destination chain
        // to transfer the tokens to the toAddress.
        IERC20(inputToken).forceApprove({
            spender: address(axelarGateway),
            value: toAmount
        });
        axelarGateway.callContractWithToken(
            bridgeRoute.destChainName,
            bridgeRoute.receiverContract.toHexString(),
            abi.encode(toAddress),
            bridgeRoute.tokenSymbol,
            toAmount
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

    receive() external payable {}
}
