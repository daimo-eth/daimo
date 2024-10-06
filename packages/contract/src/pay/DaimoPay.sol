// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

import "../../vendor/cctp/ICCTPReceiver.sol";
import "../../vendor/cctp/ICCTPTokenMessenger.sol";
import "../../vendor/cctp/ITokenMinter.sol";
import "./DaimoPayBridger.sol";
import "./PayIntent.sol";
import "./PayIntentFactory.sol";
import "./TokenUtils.sol";

// A Daimo Pay transfer has 4 steps:
// 1. Alice sends (tokenIn, amountIn) to handoff address on chain A -- simple erc20 transfer
// 2. LP swaps tokenIn to bridgeTokenIn and burns on chain A -- LP runs this in sendAndSelfDestruct
//    - LP doesnt need approve or anything else, just quote and swap.
//    - quote comes from the handoff address which commits to the destination bridgeTokenOut amount, and therefore bridgeTokenIn amount.
//    - LP has to fetch swap from Uniswap or similar

// Fork: fastFinish, then claim
// Fork: claim directly

// 4. LP swaps bridgeTokenOut to tokenOut on chain B -- LP runs this in completeAction
// Alice is responsible for putting a quote for the bridgeTokenOut <> tokenOut swap
// This fixes bridgeTokenOut expected amount, which in turn fixes the bridgeTokenIn burn amount,
// locking in the amounts expected for all intermediary swaps.

// To be nice Alice can put a a slightly worse quote than the market price to incentive LP.

/// @title Daimo Pay contract for creating and fulfilling cross-chain actions
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Allows optimistic fast actions. Alice initiates a transfer by calling
/// `startAction` on chain A. After the bridging delay (10+ min for CCTP),
/// funds arrive at the intent address deployed on chain B. Bob can call
/// `claimAction` function to perform Bob's action. Alternatively, immediately
/// after the first call, an LP can call `fastFinishAction` to perform Bob's
/// action immediately. Later, when the funds arrive from the bridge, the LP
/// (rather than Bob) will claim.
contract DaimoPay {
    using SafeERC20 for IERC20;

    PayIntentFactory public immutable intentFactory;
    DaimoPayBridger public immutable bridger;

    /// Commit to transfer details in an intent address.
    mapping(address intentAddr => bool) public intentSent;
    /// On the receiving chain, map each intent to a recipient (LP or Bob).
    mapping(address intentAddr => address) public intentToRecipient;

    // Action initiated on chain A
    event Start(address indexed intentAddr, PayIntent intent);

    // Action completed ~immediately on chain B
    event FastFinish(
        address indexed intentAddr,
        address indexed newRecipient,
        PayIntent intent
    );

    // Action settled later, once the underlying bridge transfer completes.
    event Claim(
        address indexed intentAddr,
        address indexed finalRecipient,
        PayIntent intent
    );

    // When the action is completed as expected, emit this event
    event ActionCompleted(
        address indexed intentAddr,
        address indexed destinationAddress
    );

    // When the action is a call that fails, we bounce the funds to the
    // specified refund address and emit this event
    event ActionBounced(
        address indexed intentAddr,
        address indexed refundAddress
    );

    constructor(PayIntentFactory _intentFactory, DaimoPayBridger _bridger) {
        intentFactory = _intentFactory;
        bridger = _bridger;
    }

    // Helper functions to convert between address and bytes32
    // Solana and Tron addresses are 32 bytes, but Ethereum addresses are 20 bytes.
    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function bytes32ToAddress(bytes32 b) internal pure returns (address) {
        return address(uint160(uint256(b)));
    }

    function startAction(
        PayIntent calldata intent,
        Call[] calldata swapCalls,
        bytes calldata bridgeExtraData
    ) public {
        PayIntentContract intentContract = intentFactory.createIntent(intent);

        // Ensure we don't reuse a nonce in the case where Alice is sending to
        // same destination with the same nonce multiple times.
        require(!intentSent[address(intentContract)], "DP: already sent");
        intentSent[address(intentContract)] = true;

        intentContract.sendAndSelfDestruct(
            intent,
            bridger,
            swapCalls,
            bridgeExtraData
        );

        emit Start({intentAddr: address(intentContract), intent: intent});
    }

    // Pays Bob immediately on chain B. The caller LP sends (toToken, toAmount).
    // Later, when the slower bridge transfer arrives, the LP will be able to claim
    // (toToken, fromAmount), keeping the spread (if any) between the amounts.
    function fastFinishAction(
        PayIntent calldata intent,
        Call[] calldata swapCalls
    ) public {
        require(intent.chainId == block.chainid, "DP: wrong chain");

        // Calculate handoff address
        address intentAddr = intentFactory.getIntentAddress(intent);

        // Optimistic fast finish is only for transfers which haven't already
        // been fastFinished or claimed.
        require(
            intentToRecipient[intentAddr] == address(0),
            "DP: already finished"
        );

        // Record LP as new recipient
        intentToRecipient[intentAddr] = msg.sender;

        // LP fast-deposits  bridgeTokenOut
        intent.bridgeTokenOut.addr.safeTransferFrom(
            msg.sender,
            address(this),
            intent.bridgeTokenOut.amount
        );
        completeAction(intentAddr, intent, swapCalls);

        emit FastFinish({
            intentAddr: intentAddr,
            newRecipient: msg.sender,
            intent: intent
        });
    }

    // Claims a bridge transfer to its current recipient. If FastFinish happened
    // for this transfer, then the recipient is the LP who fronted the amount.
    // Otherwise, the recipient remains the original toAddr. The bridge transfer
    // must already have been completed; coins are already in intent contract.
    function claimAction(
        PayIntent calldata intent,
        Call[] calldata swapCalls
    ) public {
        require(intent.chainId == block.chainid, "DP: wrong chain");

        PayIntentContract intentContract = intentFactory.createIntent(intent);

        // Transfer from intent contract to this contract
        intentContract.receiveAndSelfDestruct(intent);

        // Finally, forward the balance to the current recipient
        address recipient = intentToRecipient[address(intentContract)];
        if (recipient == address(0)) {
            // No LP showed up, so just complete the action.
            recipient = intent.finalCall.to;

            intentToRecipient[address(intentContract)] = recipient;
            completeAction(address(intentContract), intent, swapCalls);
        } else {
            // Otherwise, the LP fastFinished the action, give them the recieved
            // amount.
            intent.bridgeTokenOut.addr.safeTransfer(
                recipient,
                intent.bridgeTokenOut.amount
            );
        }

        emit Claim({
            intentAddr: address(intentContract),
            finalRecipient: recipient,
            intent: intent
        });
    }

    // Swap  bridgeTokenOut to finalCallToken
    // Then, if the action has calls, make the action calls.
    // Otherwise, transfer the token to the action address.
    function completeAction(
        address intentAddr,
        PayIntent calldata intent,
        Call[] calldata swapCalls
    ) internal {
        // Run arbitrary calls provided by the LP. These will generally approve
        // the swap contract and swap if necessary
        for (uint256 i = 0; i < swapCalls.length; ++i) {
            Call calldata call = swapCalls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "DP: swap call failed");
        }

        // Check that swap had a fair price
        uint256 finalCallTokenBalance = TokenUtils.getBalanceOf(
            intent.finalCallToken.addr,
            address(this)
        );

        require(
            finalCallTokenBalance >= intent.finalCallToken.amount,
            "DP: insufficient final call token received"
        );

        if (intent.finalCall.data.length > 0) {
            // If the intent is a call, approve the final token and make the call
            TokenUtils.approve(
                intent.finalCallToken.addr,
                address(intent.finalCall.to),
                intent.finalCallToken.amount
            );
            (bool success, ) = intent.finalCall.to.call{
                value: intent.finalCall.value
            }(intent.finalCall.data);

            if (success) {
                emit ActionCompleted({
                    intentAddr: intentAddr,
                    destinationAddress: intent.finalCall.to
                });
            } else {
                TokenUtils.transfer(
                    intent.finalCallToken.addr,
                    payable(intent.refundAddress),
                    intent.finalCallToken.amount
                );

                emit ActionBounced({
                    intentAddr: intentAddr,
                    refundAddress: intent.refundAddress
                });
            }
        } else {
            // If the final call is a transfer, transfer the token
            // Transfers can never bounce.
            TokenUtils.transfer(
                intent.finalCallToken.addr,
                payable(intent.finalCall.to),
                intent.finalCallToken.amount
            );

            emit ActionCompleted({
                intentAddr: intentAddr,
                destinationAddress: intent.finalCall.to
            });
        }
    }

    receive() external payable {}
}
