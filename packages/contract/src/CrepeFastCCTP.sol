// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

import "../vendor/cctp/ICCTPReceiver.sol";
import "../vendor/cctp/ICCTPTokenMessenger.sol";
import "../vendor/cctp/ITokenMinter.sol";
import "./CrepeHandoff.sol";
import "./CrepeHandoffFactory.sol";
import "./CrepeUtils.sol";

// a Crepe transfer is 4 steps:
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

/// @title Wraps Circle's Cross-Chain Transfer Protocol (CCTP) for fast cross-chain actions
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Wraps CCTP. Allows optimistic fast actions. Alice initiates a transfer by
/// calling `startAction` on chain A. After the CCTP delay (currently 10+ min),
/// funds arrive at the DaimoFastCCTP contract deployed on chain B. Bob can call
/// `claimAction` function to perform Bob's action. Alternately, immediately after the first
/// call, an LP can call `fastFinishAction` to perform Bob's action immediately.
/// Later, when the funds arrive from CCTP, the LP (rather than Bob) will claim.
contract CrepeFastCCTP {
    using SafeERC20 for IERC20;

    /// The CCTP contracts.
    ITokenMinter public immutable tokenMinter;
    ICCTPTokenMessenger public immutable cctpMessenger;
    CrepeHandoffFactory public immutable handoffFactory;

    /// Commit to transfer details in a handoff address. See CrepeHandoff.
    mapping(address handoffAddr => bool) public handoffSent;
    /// On the receiving chain, map each transfer to a recipient (LP or Bob).
    mapping(address handoffAddr => address) public handoffToRecipient;

    // Action initiated on chain A
    event Start(address indexed handoffAddr, Destination destination);

    // Action completed ~immediately on chain B
    event FastFinish(
        address indexed handoffAddr,
        address indexed newRecipient,
        Destination destination
    );

    // Action settled later, once the underlying CCTP transfer completes.
    event Claim(
        address indexed handoffAddr,
        address indexed finalRecipient,
        Destination destination
    );

    // When the action is completed as expected, emit this event
    event ActionCompleted(
        address indexed handoffAddr,
        address indexed destinationAddress
    );

    // When the action is a call that fails, we bounce the funds to the 
    // specified refund address and emit this event
    event ActionBounced(
        address indexed handoffAddr,
        address indexed refundAddress
    );

    constructor(
        ITokenMinter _tokenMinter,
        ICCTPTokenMessenger _cctpMessenger,
        CrepeHandoffFactory _handoffFactory
    ) {
        tokenMinter = _tokenMinter;
        cctpMessenger = _cctpMessenger;
        handoffFactory = _handoffFactory;
    }

    // Helper functions to convert between address and bytes32
    // Solana and Tron addresses are 32 bytes, but Ethereum addresses are 20 bytes.
    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function bytes32ToAddress(bytes32 b) internal pure returns (address) {
        return address(uint160(uint256(b)));
    }

    // getCurrentChainCCTPToken gets the CCTP token for the current chain
    // corresponding to the destination chain's CCTP token.
    function getCurrentChainCCTPToken(
        Destination calldata destination
    ) public view returns (IERC20) {
        if (destination.chainId == block.chainid) {
            return destination.mintToken.addr;
        } else {
            return
                IERC20(
                    tokenMinter.getLocalToken(
                        destination.domain,
                        addressToBytes32(address(destination.mintToken.addr))
                    )
                );
        }
    }

    function startAction(
        TokenAmount[] calldata approvals,
        Call calldata swapCall,
        Destination calldata destination
    ) public {
        TokenAmount memory expectedBurn = TokenAmount({
            addr: getCurrentChainCCTPToken(destination),
            amount: destination.mintToken.amount
        });

        CrepeHandoff handoff = handoffFactory.createHandoff(
            payable(address(this)),
            destination
        );

        // Ensure we don't reuse a nonce in the case where Alice is sending to
        // same destination with the same nonce multiple times.
        require(!handoffSent[address(handoff)], "FCCTP: already sent");
        handoffSent[address(handoff)] = true;

        handoff.sendAndSelfDestruct(
            cctpMessenger,
            approvals,
            swapCall,
            expectedBurn
        );

        emit Start({handoffAddr: address(handoff), destination: destination});
    }

    // Pays Bob immediately on chain B. The caller LP sends (toToken, toAmount).
    // Later, when the slower CCTP transfer arrives, the LP will be able to claim
    // (toToken, fromAmount), keeping the spread (if any) between the amounts.
    function fastFinishAction(
        Destination calldata destination,
        Call calldata swapCall
    ) public {
        require(destination.chainId == block.chainid, "FCCTP: wrong chain");

        // Calculate handoff address
        address handoffAddr = handoffFactory.getHandoffAddress(
            payable(address(this)),
            destination
        );

        // Optimistic fast finish is only for transfers which haven't already
        // been fastFinished or claimed.
        require(
            handoffToRecipient[handoffAddr] == address(0),
            "FCCTP: already finished"
        );

        // Record LP as new recipient
        handoffToRecipient[handoffAddr] = msg.sender;

        // LP fast-deposits mintToken
        CrepeTokenUtils.transferFrom(
            destination.mintToken.addr,
            msg.sender,
            address(this),
            destination.mintToken.amount
        );
        completeAction(handoffAddr, destination, swapCall);

        emit FastFinish({
            handoffAddr: handoffAddr,
            newRecipient: msg.sender,
            destination: destination
        });
    }

    // Claims a CCTP transfer to its current recipient. If FastFinish happened
    // for this transfer, then the recipient is the LP who fronted the amount.
    // Otherwise, the recipient remains the original toAddr. The CCTP message
    // must already have been relayed; coins are already in handoff.
    function claimAction(
        Destination calldata destination,
        Call calldata swapCall
    ) public {
        require(destination.chainId == block.chainid, "FCCTP: wrong chain");

        CrepeHandoff handoff = handoffFactory.createHandoff(
            payable(address(this)),
            destination
        );

        // Transfer from handoff to FastCCTP
        handoff.receiveAndSelfDestruct();

        // Finally, forward the balance to the current recipient
        address recipient = handoffToRecipient[address(handoff)];
        if (recipient == address(0)) {
            // No LP showed up, so just complete the action.
            recipient = destination.finalCall.to;

            handoffToRecipient[address(handoff)] = recipient;
            completeAction(address(handoff), destination, swapCall);
        } else {
            // Otherwise, the LP fastFinished the action, give them the recieved
            // amount.
            destination.mintToken.addr.safeTransfer(
                recipient,
                destination.mintToken.amount
            );
        }

        emit Claim({
            handoffAddr: address(handoff),
            finalRecipient: recipient,
            destination: destination
        });
    }

    // swap mintToken to finalCallToken
    // Then, if an action is a call, make the action call with the given token
    // approved. Otherwise, transfer the token to the action address.
    function completeAction(
        address handoffAddr,
        Destination calldata destination,
        Call calldata swapCall
    ) internal {
        // Swap mintToken to finalCallToken
        if (swapCall.data.length > 0) {
            destination.mintToken.addr.forceApprove(
                address(swapCall.to),
                destination.mintToken.amount
            );
            (bool success, ) = swapCall.to.call{value: swapCall.value}(
                swapCall.data
            );
            require(success, "FCCTP: swap failed");
        }

        // Check swap had a fair price
        uint256 finalCallTokenBalance = CrepeTokenUtils.getBalanceOf(
            destination.finalCallToken.addr,
            address(this)
        );

        require(
            finalCallTokenBalance >= destination.finalCallToken.amount,
            "FCCTP: insufficient final call token received"
        );

        if (destination.finalCall.data.length > 0) {
            // If the intent is a call, approve the final token and make the call
            CrepeTokenUtils.approve(
                destination.finalCallToken.addr,
                address(destination.finalCall.to),
                destination.finalCallToken.amount
            );
            (bool success, ) = destination.finalCall.to.call{
                value: destination.finalCall.value
            }(destination.finalCall.data);

            if (success) {
                emit ActionCompleted({
                    handoffAddr: handoffAddr,
                    destinationAddress: destination.finalCall.to
                });
            } else {
                CrepeTokenUtils.transfer(
                    destination.finalCallToken.addr,
                    payable(destination.refundAddress),
                    destination.finalCallToken.amount
                );

                emit ActionBounced({
                    handoffAddr: handoffAddr,
                    refundAddress: destination.refundAddress
                });
            }
        } else {
            // If the final call is a transfer, transfer the token
            // Transfers can never bounce.
            CrepeTokenUtils.transfer(
                destination.finalCallToken.addr,
                payable(destination.finalCall.to),
                destination.finalCallToken.amount
            );

            emit ActionCompleted({
                handoffAddr: handoffAddr,
                destinationAddress: destination.finalCall.to
            });
        }
    }

    receive() external payable {}
}
