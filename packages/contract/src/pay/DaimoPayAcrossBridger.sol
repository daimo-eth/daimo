// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IDaimoPayBridger.sol";
import "../../vendor/across/V3SpokePoolInterface.sol";

/// @title Bridger implementation for Across Protocol
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Bridges assets from to a destination chain using Across Protocol. Makes the
/// assumption that the local token is an ERC20 token and has a 1 to 1 price
/// with the corresponding destination token.
contract DaimoPayAcrossBridger is IDaimoPayBridger {
    using SafeERC20 for IERC20;

    struct ExtraData {
        address exclusiveRelayer;
        uint32 quoteTimestamp;
        uint32 fillDeadline;
        uint32 exclusivityDeadline;
        bytes message;
    }

    address public immutable owner;

    // SpokePool contract address for this chain.
    V3SpokePoolInterface public immutable spokePool;
    // Minimum percentage fee to pay the Across relayer. This contract checks
    // that the input amount is at least this much larger than the output amount
    // 1% is represented as 1e16, 100% is 1e18, 50% is 5e17. This is how Across
    // represents percentage fees.
    uint256 public minPercentageFee;
    uint256 public immutable oneHundredPercent = 1e18;

    // Mapping from destination chain and token to the corresponding token on
    // the current chain.
    mapping(uint256 toChainId => mapping(address toToken => address localToken))
        public localTokenMapping;

    event TokenPairAdded(
        uint256 indexed toChain,
        address indexed toToken,
        address indexed localToken
    );
    event TokenPairRemoved(
        uint256 indexed toChain,
        address indexed toToken,
        address indexed localToken
    );

    /// Specify owner (not msg.sender) to allow CREATE3 deployment.
    constructor(
        address _initialOwner,
        V3SpokePoolInterface _spokePool,
        uint256 _minPercentageFee
    ) {
        owner = _initialOwner;
        spokePool = _spokePool;
        minPercentageFee = _minPercentageFee;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DPAB: caller is not the owner");
        _;
    }

    // ----- ADMIN FUNCTIONS -----

    /// Initialize. Specify the localToken mapping to destination chains and tokens
    function init(
        uint256[] memory _toChainIds,
        address[] memory _toTokens,
        address[] memory _localTokens
    ) public onlyOwner {
        uint256 n = _toChainIds.length;
        require(n == _toTokens.length, "DPAB: wrong toTokens length");
        require(n == _localTokens.length, "DPAB: wrong localTokens length");

        for (uint256 i = 0; i < n; ++i) {
            _addTokenPair(_toChainIds[i], _toTokens[i], _localTokens[i]);
        }
    }

    /// Set the minimum percentage fee to pay the Across relayer.
    function setMinPercentageFee(uint256 _minPercentageFee) public onlyOwner {
        minPercentageFee = _minPercentageFee;
    }

    /// Map a token on a destination chain to a token on the current chain.
    /// Assumes the local token has a 1 to 1 price with the corresponding
    /// destination token.
    function addTokenPair(
        uint256 toChainId,
        address toToken,
        address localToken
    ) public onlyOwner {
        _addTokenPair(toChainId, toToken, localToken);
    }

    function _addTokenPair(
        uint256 toChainId,
        address toToken,
        address localToken
    ) private {
        localTokenMapping[toChainId][toToken] = localToken;
        emit TokenPairAdded(toChainId, toToken, localToken);
    }

    function removeTokenPair(
        uint256 toChainId,
        address toToken
    ) public onlyOwner {
        address localToken = localTokenMapping[toChainId][toToken];
        delete localTokenMapping[toChainId][toToken];
        emit TokenPairRemoved(toChainId, toToken, localToken);
    }

    // ----- BRIDGING FUNCTIONS -----

    /// Get the local token that corresponds to the destination token.
    function getInputToken(
        uint256 toChainId,
        address toToken
    ) public view returns (address) {
        return localTokenMapping[toChainId][toToken];
    }

    /// Get the minimum input amount for a given output amount accounting
    /// for the percentage fee.
    function getInputAmount(
        uint256 /* toChainId */,
        address /* toToken */,
        uint256 toAmount
    ) public view returns (uint256) {
        return
            (toAmount * (oneHundredPercent + minPercentageFee)) /
            oneHundredPercent;
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
        address inputToken = getInputToken(toChainId, toToken);
        require(
            address(inputToken) != address(0),
            "DPAB: input token not found"
        );

        uint256 inputAmount = getInputAmount(toChainId, toToken, toAmount);

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

        emit BridgeInitiated(
            toChainId,
            toAddress,
            toToken,
            toAmount,
            inputToken,
            inputAmount
        );
    }
}
