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
/// Bridges assets from to a destination chain using Across Protocol.
contract DaimoPayAcrossBridger is IDaimoPayBridger {
    using SafeERC20 for IERC20;

    struct ExtraData {
        address exclusiveRelayer;
        uint32 quoteTimestamp;
        uint32 fillDeadline;
        uint32 exclusivityDeadline;
        bytes message;
    }

    // SpokePool contract address for this chain.
    V3SpokePoolInterface public immutable spokePool;

    constructor(V3SpokePoolInterface _spokePool) {
        spokePool = _spokePool;
    }

    /// Initiate a bridge to a destination chain using Across Protocol.
    function sendToChain(
        address fromToken,
        uint256 fromAmount,
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata extraData
    ) public {
        require(toChainId != block.chainid, "DPAB: same chain");
        require(toAmount > 0, "DPAB: zero amount");

        // Parse remaining arguments from extraData
        ExtraData memory extra;
        extra = abi.decode(extraData, (ExtraData));

        // Move input token from caller to this contract and approve the
        // SpokePool contract.
        IERC20(fromToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: fromAmount
        });
        IERC20(fromToken).forceApprove({
            spender: address(spokePool),
            value: fromAmount
        });

        spokePool.depositV3({
            depositor: address(this),
            recipient: toAddress,
            inputToken: fromToken,
            outputToken: toToken,
            inputAmount: fromAmount,
            outputAmount: toAmount,
            destinationChainId: toChainId,
            exclusiveRelayer: extra.exclusiveRelayer,
            quoteTimestamp: extra.quoteTimestamp,
            fillDeadline: extra.fillDeadline,
            exclusivityDeadline: extra.exclusivityDeadline,
            message: extra.message
        });

        emit BridgeInitiated(
            msg.sender,
            toChainId,
            toAddress,
            fromToken,
            fromAmount,
            toToken,
            toAmount
        );
    }
}
