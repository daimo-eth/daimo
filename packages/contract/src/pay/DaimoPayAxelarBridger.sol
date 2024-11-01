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
        // Axelar requires the name of the destination chain, e.g. "base",
        // "binance".
        string destChainName;
        address bridgeTokenIn;
        address bridgeTokenOut;
        // Axelar requires the symbol name of the token to be sent to the
        // destination chain, e.g. "axlUSDC".
        string bridgeTokenOutSymbol;
        // When bridging with an Axelar contract call, the receiver on the
        // destination chain must be a contract that implements the
        // AxelarExecutableWithToken interface.
        address receiverContract;
        // Fee to be paid in native token for Axelar's bridging gas fee
        uint256 fee;
    }

    struct ExtraData {
        // Address to refund excess gas fees to.
        address gasRefundAddress;
        // Whether to use Axelar Express bridging.
        bool useExpress;
    }

    // Axelar contracts for this chain.
    IAxelarGatewayWithToken public immutable axelarGateway;
    IAxelarGasService public immutable axelarGasService;

    // Mapping from destination chain and token to the corresponding token on
    // the current chain.
    mapping(uint256 toChainId => AxelarBridgeRoute bridgeRoute)
        public bridgeRouteMapping;

    event BridgeRouteAdded(
        uint256 indexed toChainId,
        AxelarBridgeRoute bridgeRoute
    );

    event BridgeRouteRemoved(
        uint256 indexed toChainId,
        AxelarBridgeRoute bridgeRoute
    );

    /// Specify the localToken mapping to destination chains and tokens
    constructor(
        address _owner,
        IAxelarGatewayWithToken _axelarGateway,
        IAxelarGasService _axelarGasService,
        uint256[] memory _toChainIds,
        AxelarBridgeRoute[] memory _bridgeRoutes
    )
        Ownable(_owner)
        AxelarExpressExecutableWithToken(address(_axelarGateway))
    {
        axelarGateway = _axelarGateway;
        axelarGasService = _axelarGasService;
        _setBridgeRoutes({
            toChainIds: _toChainIds,
            bridgeRoutes: _bridgeRoutes
        });
    }

    // ----- ADMIN FUNCTIONS -----

    /// Map a token on a destination chain to a token on the current chain.
    /// Assumes the local token has a 1 to 1 price with the corresponding
    /// destination token.
    function setBridgeRoutes(
        uint256[] memory toChainIds,
        AxelarBridgeRoute[] memory bridgeRoutes
    ) public onlyOwner {
        _setBridgeRoutes({toChainIds: toChainIds, bridgeRoutes: bridgeRoutes});
    }

    function _setBridgeRoutes(
        uint256[] memory toChainIds,
        AxelarBridgeRoute[] memory bridgeRoutes
    ) private {
        uint256 n = toChainIds.length;
        require(n == bridgeRoutes.length, "DPAB: wrong bridgeRoutes length");

        for (uint256 i = 0; i < n; ++i) {
            bridgeRouteMapping[toChainIds[i]] = bridgeRoutes[i];
            emit BridgeRouteAdded({
                toChainId: toChainIds[i],
                bridgeRoute: bridgeRoutes[i]
            });
        }
    }

    function removeBridgeRoutes(uint256[] memory toChainIds) public onlyOwner {
        for (uint256 i = 0; i < toChainIds.length; ++i) {
            AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[
                toChainIds[i]
            ];
            delete bridgeRouteMapping[toChainIds[i]];
            emit BridgeRouteRemoved({
                toChainId: toChainIds[i],
                bridgeRoute: bridgeRoute
            });
        }
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

    /// Given a list of bridge token options, find the index of the bridge token
    /// that matches the correct bridge token out. Return the length of the array
    /// if no match is found.
    function _findBridgeTokenOut(
        TokenAmount[] memory bridgeTokenOutOptions,
        address bridgeTokenOut
    ) internal pure returns (uint256 index) {
        uint256 n = bridgeTokenOutOptions.length;
        for (uint256 i = 0; i < n; ++i) {
            if (address(bridgeTokenOutOptions[i].token) == bridgeTokenOut) {
                return i;
            }
        }
        return n;
    }

    /// Get the local token that corresponds to the destination token.
    function _getBridgeData(
        uint256 toChainId,
        TokenAmount[] memory bridgeTokenOutOptions
    )
        internal
        view
        returns (
            address inToken,
            uint256 inAmount,
            address outToken,
            string memory outTokenSymbol,
            uint256 outAmount,
            string memory destChainName,
            address receiverContract,
            uint256 fee
        )
    {
        AxelarBridgeRoute memory bridgeRoute = bridgeRouteMapping[toChainId];
        require(
            bridgeRoute.bridgeTokenOut != address(0),
            "DPAB: bridge route not found"
        );

        uint256 index = _findBridgeTokenOut(
            bridgeTokenOutOptions,
            bridgeRoute.bridgeTokenOut
        );
        // If the index is the length of the array, then the bridge token out
        // was not found in the list of options.
        require(index < bridgeTokenOutOptions.length, "DPAB: bad bridge token");

        inToken = bridgeRoute.bridgeTokenIn;
        // Assumes the input token has a 1 to 1 price with the destination token.
        // Gas fees are charged in native token and paid separately.
        inAmount = bridgeTokenOutOptions[index].amount;

        outToken = bridgeRoute.bridgeTokenOut;
        outTokenSymbol = bridgeRoute.bridgeTokenOutSymbol;
        outAmount = bridgeTokenOutOptions[index].amount;

        destChainName = bridgeRoute.destChainName;
        receiverContract = bridgeRoute.receiverContract;
        fee = bridgeRoute.fee;
    }

    function getBridgeTokenIn(
        uint256 toChainId,
        TokenAmount[] memory bridgeTokenOutOptions
    ) public view returns (address bridgeTokenIn, uint256 inAmount) {}

    /// Initiate a bridge to a destination chain using Axelar Protocol.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        TokenAmount[] memory bridgeTokenOutOptions,
        bytes calldata extraData
    ) public {
        require(toChainId != block.chainid, "DPAxB: same chain");

        (
            address inToken,
            uint256 inAmount,
            address outToken,
            string memory outTokenSymbol,
            uint256 outAmount,
            string memory destChainName,
            address receiverContract,
            uint256 fee
        ) = _getBridgeData(toChainId, bridgeTokenOutOptions);
        require(outAmount > 0, "DPAxB: zero amount");

        // Parse remaining arguments from extraData
        ExtraData memory extra;
        extra = abi.decode(extraData, (ExtraData));

        // Move input token from caller to this contract
        IERC20(inToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: inAmount
        });

        // Pay for Axelar's bridging gas fee.
        if (extra.useExpress) {
            axelarGasService.payNativeGasForExpressCallWithToken{value: fee}(
                address(this),
                destChainName,
                receiverContract.toHexString(),
                abi.encode(toAddress),
                outTokenSymbol,
                outAmount,
                extra.gasRefundAddress
            );
        } else {
            axelarGasService.payNativeGasForContractCallWithToken{value: fee}(
                address(this),
                destChainName,
                receiverContract.toHexString(),
                abi.encode(toAddress),
                outTokenSymbol,
                outAmount,
                extra.gasRefundAddress
            );
        }

        // Approve the AxelarGateway contract and initiate the bridge. Send the
        // tokens to the receiverContract on the destination chain. The
        // _executeWithToken function will be called on the destination chain.
        IERC20(inToken).forceApprove({
            spender: address(axelarGateway),
            value: inAmount
        });
        axelarGateway.callContractWithToken(
            destChainName,
            receiverContract.toHexString(),
            abi.encode(toAddress),
            outTokenSymbol,
            outAmount
        );

        emit BridgeInitiated({
            fromAddress: msg.sender,
            fromToken: inToken,
            fromAmount: inAmount,
            toChainId: toChainId,
            toAddress: toAddress,
            toToken: outToken,
            toAmount: outAmount
        });
    }

    receive() external payable {}
}
