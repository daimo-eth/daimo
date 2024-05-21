import { Address, Hex } from "viem";

import { DaimoNoteStatus, DaimoRequestV2Status } from "./daimoLinkStatus";
import { ForeignCoin } from "./foreignCoin";
import { BigIntStr } from "./model";

/**
 * An OpEvent is an onchain event affecting a Daimo account. Each OpEvent
 * corresponds to an Ethereum event log. Usually--but not always--it is also
 * 1:1 with a Daimo userop.
 *
 * In the pending state, we don't have an event log yet--instead we have an
 * opHash &/or a txHash, and a future event log which we're expecting.
 *
 * Examples:
 *
 * - Sending from a Daimo account (Transfer log, userop)
 * - Receiving from elsewhere (Transfer log, may or may not be a userop)
 * - Registering a name (Register log, userop)
 * - Adding or removing a device (AddDevice / RemoveDevice log, userop)
 * - Creating or redeeming a Note (NoteCreated / NoteRedeemed log, userop)
 */
export type OpEvent = TransferOpEvent | PaymentLinkOpEvent | KeyRotationOpEvent;

export type DisplayOpEvent = TransferOpEvent | PaymentLinkOpEvent;

/**
 *  Fetched data for a pending OpEvent. For a pending op, we (usually)
 *  only know either the opHash or the txHash. Set only one of them in this
 *  type to uniquely identify a pending user action.
 *  Additionally include data that the API may have pre-fetched for the now
 *  authenticated user.
 */
export type PendingOpEvent = {
  opHash?: Hex;
  txHash?: Hex;
  inviteCode?: string;
};

export type PreSwapTransfer = {
  coin: ForeignCoin;
  amount: BigIntStr; // in native unit of the token
  from: Address;
};

/**
 * Represents a transfer of tokens from one address to another.
 *
 * There's a surprising amount of complexity to the state of a transfer.
 *
 * - Daimo transfers start out as a `PENDING` user op.
 *   The op goes thru a lifecycle of pending (bundler has accepted, but not
 *   yet onchain) to confirmed (bundle transaction onchain) to finalized
 *   (written to a finalized L1 block, and therefore guaranteed permanent).
 *
 *   For an optimistic rollup, a userop is arguably not finalized till the
 *   challenge period is up; an L2 node can be 100% certain that a given op is
 *   final after ~6 minutes (valid L2 root included in finalized L1 block) but
 *   anyone not running an L2 full node has to wait a ~week to be sure.
 *
 * - A transfer ends up `CONFIRMED`/`FINALIZED` or `FAILED` if the op reverted.
 *
 * - A transfer can come from anywhere. Non-Daimo contracts or accounts
 *   of any kind can send coins to a Daimo account. We learn about these *only*
 *   from Transfer events--the userOpHash is null.
 *
 * - Daimo transfer, by contrast, will have a userOpHash, allowing us to track
 *   them in the pending state.
 *
 * - For Daimo transfers, we show the username of the sender or recipient.
 *
 * - For others, we show an address, except for a few special ones where we can
 *   show a descriptive slug like Daimo Faucet, Coinbase, or Binance.
 */
export interface TransferOpEvent extends OpEventBase {
  type: "transfer";

  from: Address;
  to: Address;

  /** TODO: use bigint? Unnecessary for USDC. MAX_SAFE_INT = $9,007,199,254 */
  amount: number;

  /** Userop nonce, if this transfer occurred in a userop */
  nonceMetadata?: Hex;

  /** Request metadata, if this transfer fulfilled a request */
  requestStatus?: DaimoRequestV2Status;

  /** Memo, user-generated text for the transfer */
  memo?: string;

  /** If the transfer was caused by a user-initiated swap, the swap origin */
  preSwapTransfer?: PreSwapTransfer;
}

export interface PaymentLinkOpEvent extends OpEventBase {
  type: "createLink" | "claimLink";

  from: Address;
  to: Address;

  /** TODO: use bigint? Unnecessary for USDC. MAX_SAFE_INT = $9,007,199,254 */
  amount: number;

  noteStatus: DaimoNoteStatus;

  /** Userop nonce, if this link occurred in a userop */
  nonceMetadata?: Hex;
}

export interface KeyRotationOpEvent extends OpEventBase {
  type: "keyRotation";

  slot: number;
  rotationType: "add" | "remove";
}

interface OpEventBase {
  /** Unix seconds. When pending, bundler accept time. Otherwise, block time. */
  timestamp: number;

  /** Eg, "pending", "confirmed", or "failed" */
  status: OpStatus;

  /* Set for transactions part of a userop */
  opHash?: Hex;

  /* Can be set when we're pre-notified of a non-userop tx, eg faucet send */
  txHash?: Hex;

  /* Below are only set once we have a Transfer event. */
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;

  /* Fees paid to paymaster for corresponding userop, in USDC amount.
   * Estimate if pending, actual if not. 0 if paymaster wasn't used.
   */
  feeAmount?: number;
}

export enum OpStatus {
  /** Accepted by bundler &/or in mempool, but not yet onchain. */
  pending = "pending",
  /** Succeeded onchain. */
  confirmed = "confirmed",
  /** Succeeded onchain, & guaranteed via a finalized L1 block. */
  finalized = "finalized",
  /** Failed onchain. */
  failed = "failed",
  /** Pending too long, presumed dead. */
  expired = "expired",
}

export type DaimoAccountCall = {
  dest: Address;
  value: bigint;
  data: Hex;
};

// Gets the logical from and to-addresses for a given op
// If the op creates a payment link, to = payment link until claimed, then it's
// the address of the claimer.
// If the op claims a payment link, from = sender, to = claimer.
// If the op is a swap, from = the pre-swap sender.
export function getDisplayFromTo(op: DisplayOpEvent): [Address, Address] {
  if (op.type === "transfer") {
    if (op.preSwapTransfer) return [op.preSwapTransfer.from, op.to];
    else return [op.from, op.to];
  } else {
    if (op.noteStatus.claimer?.addr === op.noteStatus.sender.addr) {
      // Self-transfer via payment link shows up as two payment link transfers
      return [op.from, op.to];
    } else {
      return [
        op.noteStatus.sender.addr,
        op.noteStatus.claimer ? op.noteStatus.claimer.addr : op.to,
      ];
    }
  }
}
