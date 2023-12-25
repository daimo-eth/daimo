import { Address, Hex } from "viem";

import { DaimoNoteStatus } from "./daimoLinkStatus";

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
 *  Unique identifier for a pending OpEvent. For a pending op, we (usually)
 *  only know either the opHash or the txHash. Set only one of them in this
 *  type to uniquely identify a pending user action.
 */
export type PendingOpEventID = {
  opHash?: Hex;
  txHash?: Hex;
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
