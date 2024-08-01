// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/Create2.sol";

import "../vendor/cctp/ICCTPReceiver.sol";
import "../vendor/cctp/ICCTPTokenMessenger.sol";
import "../vendor/cctp/ITokenMinter.sol";

/// @title Wraps Cross-Chain Transfer Protocol (CCTP) for fast transfers
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Wraps CCTP. Allows optimistic fast transfers. Alice initiates a transfer by
/// calling `startTransfer` on chain A. After the CCTP delay (currently 10+ min),
/// funds arrive at the DaimoFastCCTP contract deployed on chain B. Bob can call
/// `claimTransfer` to claim the funds. Alternately, immediately after the first
/// call, an LP can call `fastFinishTransfer` to send Bob his funds immediately.
/// Later, when the funds arrive from CCTP, the LP (rather than Bob) will claim.
contract DaimoFastCCTP {
    using SafeERC20 for IERC20;

    /// The CCTP token minter contract.
    ITokenMinter public immutable tokenMinter;
    /// Commit to transfer details in a handoff address. See EphemeralHandoff.
    mapping(address handoffAddr => bool) public handoffSent;
    /// On the receiving chain, map each transfer to a recipient (LP or Bob).
    mapping(address handoffAddr => address) public handoffToRecipient;

    // Transfer initiated on chain A
    event Start(
        address indexed handoffAddr,
        address fromAddr,
        address fromToken,
        uint256 fromAmount,
        uint256 toChainID,
        address toAddr,
        address toToken,
        uint256 toAmount,
        uint256 nonce
    );

    // Transfer completed ~immediately on chain B
    event FastFinish(
        address indexed handoffAddr,
        address indexed newRecipient,
        uint256 fromChainID,
        address fromAddr,
        uint256 fromAmount,
        address toAddr,
        address toToken,
        uint256 toAmount,
        uint256 nonce
    );

    // Transfer settled later, once the underlying CCTP transfer completes.
    event Claim(
        address indexed handoffAddr,
        address indexed finalRecipient,
        uint256 fromChainID,
        address fromAddr,
        uint256 fromAmount,
        address toAddr,
        address toToken,
        uint256 toAmount,
        uint256 nonce
    );

    constructor(address _tokenMinter) {
        tokenMinter = ITokenMinter(_tokenMinter);
    }

    // Called by Alice on Chain A. Requires (fromToken, fromAmount) approval.
    // Initiates a CCTP transfer. This is a convenience function: you can
    // achieve the same by initiating a CCTP transfer directly. Sender must
    // ensure that CCTP supports (toToken, toDomain, toChainID).
    function startTransfer(
        ICCTPTokenMessenger cctpMessenger,
        IERC20 fromToken,
        uint256 fromAmount,
        uint256 toChainID,
        uint32 toDomain,
        address toAddr,
        IERC20 toToken,
        uint256 toAmount,
        uint256 nonce
    ) public {
        require(fromAmount >= toAmount, "FCCTP: fromAmount < toAmount");
        require(
            tokenMinter.getLocalToken(
                toDomain,
                bytes32(uint256(uint160(address(toToken))))
            ) == address(fromToken),
            "FCCTP: fromToken and toToken mismatch"
        );

        // Deploy CCTP sender
        address fromAddr = msg.sender;
        address handoffAddr = getHandoffAddr({
            fromChainID: block.chainid,
            fromAddr: fromAddr,
            fromAmount: fromAmount,
            toChainID: toChainID,
            toAddr: toAddr,
            toToken: toToken,
            toAmount: toAmount,
            nonce: nonce
        });

        // Ensure we don't reuse a nonce in the case where Alice is sending Bob
        // the same amount, same source and destination chain, multiple times.
        require(!handoffSent[handoffAddr], "FCCTP: already sent");
        handoffSent[handoffAddr] = true;

        // Transfer funds from Alice. Approve to CCTP.
        fromToken.safeTransferFrom(fromAddr, address(this), fromAmount);
        fromToken.forceApprove(address(cctpMessenger), fromAmount);

        // Send (burn) to CCTP. Recipient = EphemeralHandoff address on chain B.
        bytes32 mintRecipient = bytes32(uint256(uint160(handoffAddr)));
        cctpMessenger.depositForBurn({
            amount: fromAmount,
            destinationDomain: toDomain,
            mintRecipient: mintRecipient,
            burnToken: address(fromToken)
        });

        emit Start({
            handoffAddr: handoffAddr,
            fromAddr: fromAddr,
            fromToken: address(fromToken),
            fromAmount: fromAmount,
            toChainID: toChainID,
            toAddr: toAddr,
            toToken: address(toToken),
            toAmount: toAmount,
            nonce: nonce
        });
    }

    // Pays Bob immediately on chain B. The caller LP sends (toToken, toAmount).
    // Later, when the slower CCTP transfer arrives, the LP will be able to claim
    // (toToken, fromAmount), keeping the spread (if any) between the amounts.
    function fastFinishTransfer(
        uint256 fromChainID,
        address fromAddr,
        uint256 fromAmount,
        address toAddr,
        IERC20 toToken,
        uint256 toAmount,
        uint256 nonce
    ) public {
        // Calculate handoff address
        uint256 toChainID = block.chainid;
        address handoffAddr = getHandoffAddr({
            fromChainID: fromChainID,
            fromAddr: fromAddr,
            fromAmount: fromAmount,
            toChainID: toChainID,
            toAddr: toAddr,
            toToken: toToken,
            toAmount: toAmount,
            nonce: nonce
        });

        // Optimistic fast finish is only for transfers which haven't already
        // been fastFinished or claimed.
        require(
            handoffToRecipient[handoffAddr] == address(0),
            "FCCTP: already finished"
        );

        // Record LP as new recipient
        handoffToRecipient[handoffAddr] = msg.sender;

        // LP pays original recipient
        toToken.safeTransferFrom(msg.sender, toAddr, toAmount);

        emit FastFinish({
            handoffAddr: handoffAddr,
            newRecipient: msg.sender,
            fromChainID: fromChainID,
            fromAddr: fromAddr,
            fromAmount: fromAmount,
            toAddr: toAddr,
            toToken: address(toToken),
            toAmount: toAmount,
            nonce: nonce
        });
    }

    // Claims a CCTP transfer to its current recipient. If FastFinish happened
    // for this transfer, then the recipient is the LP who fronted the amount.
    // Otherwise, the recipient remains the original toAddr. The CCTP message
    // must already have been relayed; coins are already in handoff.
    function claimTransfer(
        uint256 fromChainID,
        address fromAddr,
        uint256 fromAmount,
        address toAddr,
        IERC20 toToken,
        uint256 toAmount,
        uint256 nonce
    ) public {
        uint256 toChainID = block.chainid;
        EphemeralHandoff handoff = new EphemeralHandoff{salt: 0}(
            fromChainID,
            fromAddr,
            fromAmount,
            toChainID,
            toAddr,
            toToken,
            toAmount,
            nonce
        );

        // Transfer from handoff to FastCCTP
        handoff.receiveTransferAndSelfDestruct();

        // Finally, forward the balance to the current recipient
        address recipient = handoffToRecipient[address(handoff)];
        if (recipient == address(0)) {
            // There was no LP. Record original recipient. This ensures that
            // nobody can mistakenly fastFinish() an already-claimed transfer.
            recipient = toAddr;
            handoffToRecipient[address(handoff)] = toAddr;
        }

        // If an LP fastFinish'd the transfer previously (recipient != toAddr),
        // then the LP keeps the tip (fromAmount - toAmount), which is >= 0.
        toToken.safeTransfer(recipient, fromAmount);

        emit Claim({
            handoffAddr: address(handoff),
            finalRecipient: recipient,
            fromChainID: fromChainID,
            fromAddr: fromAddr,
            fromAmount: fromAmount,
            toAddr: toAddr,
            toToken: address(toToken),
            toAmount: toAmount,
            nonce: nonce
        });
    }

    /// Computes an ephemeral handoff address
    function getHandoffAddr(
        uint256 fromChainID,
        address fromAddr,
        uint256 fromAmount,
        uint256 toChainID,
        address toAddr,
        IERC20 toToken,
        uint256 toAmount,
        uint256 nonce
    ) public view returns (address) {
        bytes memory creationCode = abi.encodePacked(
            type(EphemeralHandoff).creationCode,
            abi.encode(
                fromChainID,
                fromAddr,
                fromAmount,
                toChainID,
                toAddr,
                toToken,
                toAmount,
                nonce
            )
        );
        return Create2.computeAddress(0, keccak256(creationCode));
    }
}

// This contract is deployed, then destroyed again in the same transaction.
// CCTP lets us pass just a few  pieces of information from chain A to chain B:
// sender, recipient, token, amount. This contract lets us encode all of the
// FastCCTP send parameters into the sender address via CREATE2.
contract EphemeralHandoff {
    using SafeERC20 for IERC20;

    address payable private immutable _creator;
    uint256 private immutable _fromAmount;
    IERC20 private immutable _toToken;

    constructor(
        uint256 /* fromChainID */,
        address /* fromAddr */,
        uint256 fromAmount,
        uint256 /* toChainID */,
        address /* toAddr */,
        IERC20 toToken,
        uint256 /* toAmount */,
        uint256 /* nonce */
    ) {
        _creator = payable(msg.sender);
        _fromAmount = fromAmount;
        _toToken = toToken;
    }

    // Called immediately after the CCTP claim.
    // Checks that the correct amount was received, then forwards to FastCCTP.
    function receiveTransferAndSelfDestruct() public {
        require(msg.sender == _creator, "FCCTP: only creator");
        uint256 amount = _toToken.balanceOf(address(this));
        require(amount >= _fromAmount, "FCCTP: insufficient balance received");

        // Send to FastCCTP, which will forward to current recipient
        _toToken.safeTransfer(_creator, amount);

        // This use of SELFDESTRUCT is compatible with EIP-6780. Handoff
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(_creator);
    }
}
