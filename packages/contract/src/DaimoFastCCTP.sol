// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../vendor/cctp/ICCTPReceiver.sol";
import "../vendor/cctp/ICCTPTokenMessenger.sol";

// Wraps CCTP. Allows optimistic fast transfers. Alice initiates a transfer by
// calling `startTransfer` on chain A. After the CCTP delay (currently 10+ min),
// funds arrive at the DaimoFastCCTP contract deployed on chain B. Bob can call
// `claimTransfer` to claim the funds. Alternately, immdiately after the first
// call, an LP can call `fastFinishTransfer` to send Bob his funds immediately.
// Later, when the funds arrive from CCTP, the LP (rather than Bob) will be able
// to claim.
contract DaimoFastCCTP {
  using SafeERC20 for IERC20;

  // Commit to transfer details in a handoff address. See EphemeralHandoff.
  mapping(address => bool) public handoffSent;
  // On receiving chain, map each transfer to recipient (LP or Bob).
  mapping(address => address) public handoffToRecipient;

  constructor() {}

  // Called by Alice on Chain A. Requires approval for (fromToken, fromAmount).
  // Initiates a CCTP transfer.
  function startTransfer(
    ICCTPTokenMessenger cctpMessenger,
    IERC20 fromToken,
    uint256 fromAmount,
    uint256 toChainID,
    address toAddr,
    uint256 toAmount,
    IERC20 toToken,
    uint256 nonce
  ) public {
    require(fromAmount >= toAmount, "FCCTP: fromAmount < toAmount");

    // Deploy CCTP sender
    uint256 fromChainID = block.chainid;
    address fromAddr = msg.sender;
    EphemeralHandoff handoff = new EphemeralHandoff{salt: 0}(
      fromChainID,
      fromAddr,
      fromAmount,
      toChainID,
      toAddr,
      toAmount,
      toToken,
      nonce
    );

    // Ensure we don't reuse nonces. This covers the case where Alice sends Bob
    // the same amount twice in a row = otherwise identical transfers = no way
    // for an LP to fastFinish() the second one without a distinct handoff addr.
    require(
      !handoffSent[address(handoff)],
      "FCCTP: identical transfer already sent"
    );
    handoffSent[address(handoff)] = true;

    // Receive funds from Alice
    fromToken.safeTransferFrom(fromAddr, address(handoff), fromAmount);

    // Initiate transfer + destroy handoff, minimizing gas consumption.
    handoff.startTransferAndSelfDestruct(cctpMessenger, fromToken);
  }

  // Pays Bob immediately on chain B. The caller LP sends (toToken, toAmount).
  // Later, when the slower CCTP transfer arrives, the LP will be able to claim
  // (toToken, fromAmount), keeping the spread (if any) between the amounts.
  function fastFinishTransfer(
    uint256 fromChainID,
    address fromAddr,
    uint256 fromAmount,
    uint256 toChainID,
    address toAddr,
    uint256 toAmount,
    IERC20 toToken,
    uint256 nonce
  ) public {
    // Calculate handoff address
    EphemeralHandoff handoff = new EphemeralHandoff{salt: 0}(
      fromChainID,
      fromAddr,
      fromAmount,
      toChainID,
      toAddr,
      toAmount,
      toToken,
      nonce
    );
    handoff.destroy();

    // Only for transfers which have not already been fastFinished or claimed.
    require(
      handoffToRecipient[address(handoff)] == address(0),
      "FCCTP: already finished"
    );

    // Record LP as new recipient
    handoffToRecipient[address(handoff)] = msg.sender;

    // LP pays original recipient
    toToken.safeTransferFrom(msg.sender, toAddr, toAmount);
  }

  // Claims a CCTP transfer to its current recipient. If fastFinish... was
  // called for this transfer, then recipient = the LP who fronted the amount.
  // Otherwise, the recipient remains the original toAddr, eg Bob.
  function claimTransfer(
    ICCTPReceiver cctpReceiver,
    bytes calldata messageBytes,
    bytes calldata signature,
    uint256 fromChainID,
    address fromAddr,
    uint256 fromAmount,
    address toAddr,
    uint256 toAmount,
    IERC20 toToken,
    uint256 nonce
  ) public {
    uint256 toChainID = block.chainid;
    EphemeralHandoff handoff = new EphemeralHandoff{salt: 0}(
      fromChainID,
      fromAddr,
      fromAmount,
      toChainID,
      toAddr,
      toAmount,
      toToken,
      nonce
    );

    // Claim from CCTP to handoff
    cctpReceiver.receiveMessage(messageBytes, signature);

    // Move from handoff to FastCCTP
    handoff.receiveTransferAndSelfDestruct();

    // Finally, forward to current recipient
    address recipient = handoffToRecipient[address(handoff)];
    if (recipient == address(0)) {
      recipient = toAddr;

      // Record claimer as recipient. This ensures that nobody can mistakenly
      // fastFinish() a transfer that has already been claimed.
      handoffToRecipient[address(handoff)] = toAddr;
    }

    // If an LP fastFinish'd the transfer previously (recipient != toAddr),
    // then the LP gains the difference fromAmount - toAmount (which can be 0).
    toToken.transfer(recipient, fromAmount);
  }
}

// This contract is deployed, then destroyed again in the same transaction.
// CCTP lets us pass just a few  pieces of information from chain A to chain B:
// sender, recipient, token, amount. This contract lets us encode all of the
// FastCCTP send parameters into the sender address via CREATE2.
contract EphemeralHandoff {
  address payable private immutable _creator;
  uint256 private immutable _fromAmount;
  uint256 private immutable _toChainID;
  IERC20 private immutable _toToken;

  constructor(
    uint256 /* fromChainID */,
    address /* fromAddr */,
    uint256 fromAmount,
    uint256 toChainID,
    address /* toAddr */,
    uint256 /* toAmount */,
    IERC20 toToken,
    uint256 /* nonce */
  ) {
    _creator = payable(msg.sender);
    _fromAmount = fromAmount;
    _toChainID = toChainID;
    _toToken = toToken;
  }

  modifier onlyCreator() {
    require(msg.sender == _creator, "Only creator can call this function");
    _;
  }

  function startTransferAndSelfDestruct(
    ICCTPTokenMessenger cctpMessenger,
    IERC20 token
  ) public onlyCreator {
    token.approve(address(cctpMessenger), _fromAmount);

    // Send to CCTP. Recipient = this same EphemeralHandoff address on chain B.
    uint32 destinationDomain = _chainIDToDomain(_toChainID);
    bytes32 mintRecipient = bytes32(bytes20(address(this)));
    cctpMessenger.depositForBurn(
      _fromAmount,
      destinationDomain,
      mintRecipient,
      address(token)
    );

    // Finally, self-destruct
    destroy();
  }

  // Called immediately after the CCTP claim.
  // Checks that the correct amount was received, then forwards to FastCCTP.
  function receiveTransferAndSelfDestruct() public onlyCreator {
    uint256 balanceReceived = _toToken.balanceOf(address(this));
    require(balanceReceived == _fromAmount, "FCCTP: wrong balance received");

    // Send to FastCCTP, which will forward to current recipient
    _toToken.transfer(_creator, _fromAmount);

    // Finally, self-destruct
    destroy();
  }

  function destroy() public onlyCreator {
    // This use of SELFDESTRUCT is compatible with EIP-6780.
    // EphemeralHandoffs are deployed, then destroyed in the same transaction.
    // solhint-disable-next-line
    selfdestruct(_creator);
  }

  // This list only restricts destination chains = compatiable DaimoAccountV2
  // home chains. The source chain could be any chain CCTP adds in the future.
  function _chainIDToDomain(uint256 chainID) private pure returns (uint32) {
    if (chainID == 1) return 0; // Ethereum
    if (chainID == 43114) return 1; // AVAX
    if (chainID == 10) return 2; // OP Mainnet
    if (chainID == 42161) return 3; // Arbitrum
    if (chainID == 8453) return 6; // Base
    if (chainID == 137) return 7; // Polygon
    revert("Unsupported chainID");
  }
}
