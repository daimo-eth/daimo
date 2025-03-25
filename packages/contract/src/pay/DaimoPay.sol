// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

import "../../vendor/cctp/ICCTPReceiver.sol";
import "../../vendor/cctp/ICCTPTokenMessenger.sol";
import "../../vendor/cctp/ITokenMinter.sol";
import "./DaimoPayBridger.sol";
import "./PayIntentFactory.sol";
import "./TokenUtils.sol";

// A Daimo Pay transfer has 4 steps:
// 1. Alice sends (tokenIn, amountIn) to the intent address on chain A. This is
//    a simple erc20 transfer.
// 2. Relayer swaps tokenIn to bridgeTokenIn and initiates bridge using
//    startIntent. The intent commits to a destination bridgeTokenOut, and the
//    bridger guarantees this amount (or reverts if not enough bridgeTokenIn).
// 3. Relayer immediately calls finishIntent on chain B.
// 4. Finally, the slow bridge transfer arrives on chain B later, and the
//    relayer can call claimIntent.

/// @title Daimo Pay contract for creating and fulfilling cross-chain intents
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// @notice Enables fast cross-chain transfers with optimistic intents
/// @dev Allows optimistic fast intents. Alice initiates a transfer by calling
/// `startIntent` on chain A. After the bridging delay (10+ min for CCTP),
/// funds arrive at the intent address deployed on chain B. Alice can call
/// `claimIntent` on chain B to finish her intent. Alternatively, immediately
/// after the first call, a relayer can call `fastFinishIntent` to finish
/// Alice's intent immediately. Later, when the funds arrive from the bridge,
/// the relayer (rather than Alice) will claim.
///
/// @notice WARNING: Never approve tokens directly to this contract. Never
/// transfer tokens to this contract as a standalone transaction.
/// Such tokens can be stolen by anyone. Instead:
/// - Users should only interact by sending funds to an intent address.
/// - Relayers should transfer funds and call this contract atomically via their
///   own contracts.
contract DaimoPay {
    using SafeERC20 for IERC20;

    address constant ADDR_MAX = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    /// Efficiently generates + deploys CREATE2 intent addresses.
    PayIntentFactory public immutable intentFactory;
    /// Bridges tokens across chains.
    DaimoPayBridger public immutable bridger;

    /// Commit to transfer details. Each intent address is single-use.
    mapping(address intentAddr => bool) public intentSent;
    /// On the receiving chain, map each intent to a recipient (relayer or Bob).
    /// - address(0) = not finished.
    /// - LP address = fast-finished, awaiting claim to repay LP.
    /// - ADDR_MAX   = claimed. any additional funds received are refunded.
    mapping(address intentAddr => address) public intentToRecipient;

    /// Intent initiated on chain A
    event Start(address indexed intentAddr, PayIntent intent);

    /// Intent completed ~immediately on chain B
    event FastFinish(address indexed intentAddr, address indexed newRecipient);

    /// Intent settled later, once the underlying bridge transfer completes.
    event Claim(address indexed intentAddr, address indexed finalRecipient);

    /// When the intent is completed, emit this event. Success false indicates
    /// that the final call reverted, and funds were refunded to refundAddr.
    event IntentFinished(
        address indexed intentAddr,
        address indexed destinationAddr,
        bool indexed success,
        PayIntent intent
    );

    // When a double-paid intent is refunded, emit this event
    event IntentRefunded(
        address indexed intentAddr,
        address indexed refundAddr,
        address token,
        uint256 amount,
        PayIntent intent
    );

    constructor(PayIntentFactory _intentFactory, DaimoPayBridger _bridger) {
        intentFactory = _intentFactory;
        bridger = _bridger;
    }

    /// Refund a double-paid intent.
    function refundIntent(PayIntent calldata intent, IERC20 token) public {
        PayIntentContract intentContract = intentFactory.createIntent(intent);
        address intentAddr = address(intentContract);
        if (intent.toChainId == block.chainid) {
            // Refund only if already claimed.
            bool claimed = intentToRecipient[address(intentContract)] ==
                ADDR_MAX;
            require(claimed, "DP: not claimed");
        } else {
            // Refund only if already started.
            require(intentSent[intentAddr], "DP: not started");
        }

        // Collect and refund overpaid amount.
        uint256 amount = intentContract.refundAndSelfDestruct(intent, token);
        require(amount > 0, "DP: no funds to refund");
        TokenUtils.transfer(token, payable(intent.refundAddress), amount);

        emit IntentRefunded({
            intentAddr: intentAddr,
            refundAddr: intent.refundAddress,
            token: address(token),
            amount: amount,
            intent: intent
        });
    }

    /// Initiates an intent, starting a bridge to dest chain if necessary.
    function startIntent(
        PayIntent calldata intent,
        Call[] calldata calls,
        bytes calldata bridgeExtraData
    ) public {
        PayIntentContract intentContract = intentFactory.createIntent(intent);

        // Ensure we don't reuse a nonce in the case where Alice is sending to
        // same destination with the same nonce multiple times.
        require(!intentSent[address(intentContract)], "DP: already sent");
        intentSent[address(intentContract)] = true;

        // Initiate bridging of funds in the intent contract to the destination
        intentContract.sendAndSelfDestruct({
            intent: intent,
            bridger: bridger,
            caller: payable(msg.sender),
            calls: calls,
            bridgeExtraData: bridgeExtraData
        });

        emit Start({intentAddr: address(intentContract), intent: intent});
    }

    /// Completes intent immediately on chain B. The relayer calls this function
    /// and atomically makes a transfer in the same transaction. The relayer
    /// can make arbitrary calls to convert the transferred tokens into the
    /// required amount of finalCallToken.
    ///
    /// Later, when the slower bridge transfer arrives, the relayer will be able
    /// to claim (bridgeTokenOut.token, bridgeTokenOut.amount), keeping the
    /// spread (if any) between the amounts.
    function fastFinishIntent(
        PayIntent calldata intent,
        Call[] calldata calls
    ) public {
        require(intent.toChainId == block.chainid, "DP: wrong chain");

        // Calculate intent address
        address intentAddr = intentFactory.getIntentAddress(intent);

        // Optimistic fast finish is only for transfers which haven't already
        // been fastFinished or claimed.
        require(
            intentToRecipient[intentAddr] == address(0),
            "DP: already finished"
        );

        // Record relayer as new recipient
        intentToRecipient[intentAddr] = msg.sender;

        // Finish the intent and return any leftover tokens to the caller
        _finishIntent({intentAddr: intentAddr, intent: intent, calls: calls});

        emit FastFinish({intentAddr: intentAddr, newRecipient: msg.sender});
    }

    /// Completes an intent, claiming funds. If FastFinish happened for this
    /// intent, then the recipient is the relayer who fronted the amount.
    /// Otherwise, the recipient remains the original addr. The bridge transfer
    /// must already have been completed; coins are already in intent contract.
    function claimIntent(
        PayIntent calldata intent,
        Call[] calldata calls
    ) public {
        require(intent.toChainId == block.chainid, "DP: wrong chain");

        PayIntentContract intentContract = intentFactory.createIntent(intent);

        // Transfer from intent contract to this contract
        intentContract.receiveAndSelfDestruct(intent);

        // Finally, forward the balance to the current recipient
        address recipient = intentToRecipient[address(intentContract)];
        if (recipient == address(0)) {
            // No relayer showed up, so just complete the intent.
            recipient = intent.finalCall.to;

            // Complete the intent and return any leftover tokens to the caller
            _finishIntent({
                intentAddr: address(intentContract),
                intent: intent,
                calls: calls
            });
        } else {
            // Otherwise, the relayer fastFinished the intent. Repay them. The
            // intent contract checks that the received amount is sufficient, so
            // we can simply transfer the balance.
            uint256 n = intent.bridgeTokenOutOptions.length;
            for (uint256 i = 0; i < n; ++i) {
                TokenAmount calldata tokenOut = intent.bridgeTokenOutOptions[i];
                TokenUtils.transferBalance({
                    token: tokenOut.token,
                    recipient: payable(recipient)
                });
            }
        }

        // Mark as claimed
        intentToRecipient[address(intentContract)] = ADDR_MAX;

        emit Claim({
            intentAddr: address(intentContract),
            finalRecipient: recipient
        });
    }

    /// Swap the token the relayer transferred to finalCallToken.
    /// Then, if the intent has a finalCall, make the intent call.
    /// Otherwise, transfer the token to the final address.
    /// Finally, send any leftover final token to the caller.
    function _finishIntent(
        address intentAddr,
        PayIntent calldata intent,
        Call[] calldata calls
    ) internal {
        // Run arbitrary calls provided by the relayer. These will generally
        // approve the swap contract and swap if necessary.
        for (uint256 i = 0; i < calls.length; ++i) {
            Call calldata call = calls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "DP: swap call failed");
        }

        // Check that swap had a fair price
        uint256 finalCallTokenBalance = TokenUtils.getBalanceOf({
            token: intent.finalCallToken.token,
            addr: address(this)
        });
        require(
            finalCallTokenBalance >= intent.finalCallToken.amount,
            "DP: insufficient final call token received"
        );

        if (intent.finalCall.data.length > 0) {
            // If the intent is a call, approve the final token and make the call
            TokenUtils.approve({
                token: intent.finalCallToken.token,
                spender: address(intent.finalCall.to),
                amount: intent.finalCallToken.amount
            });
            (bool success, ) = intent.finalCall.to.call{
                value: intent.finalCall.value
            }(intent.finalCall.data);

            // If the call fails, transfer the token to the refund address
            if (!success) {
                TokenUtils.transfer({
                    token: intent.finalCallToken.token,
                    recipient: payable(intent.refundAddress),
                    amount: intent.finalCallToken.amount
                });
            }

            emit IntentFinished({
                intentAddr: intentAddr,
                destinationAddr: intent.finalCall.to,
                success: success,
                intent: intent
            });
        } else {
            // If the final call is a transfer, transfer the token
            // Transfers can never fail.
            TokenUtils.transfer({
                token: intent.finalCallToken.token,
                recipient: payable(intent.finalCall.to),
                amount: intent.finalCallToken.amount
            });

            emit IntentFinished({
                intentAddr: intentAddr,
                destinationAddr: intent.finalCall.to,
                success: true,
                intent: intent
            });
        }

        TokenUtils.transferBalance({
            token: intent.finalCallToken.token,
            recipient: payable(msg.sender)
        });
    }

    receive() external payable {}
}
