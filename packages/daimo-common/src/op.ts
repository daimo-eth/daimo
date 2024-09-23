import { ForeignToken } from "@daimo/contract";
import { Address, Hex } from "viem";

import { DaimoNoteStatus, DaimoRequestV2Status } from "./daimoLinkStatus";
import { BigIntStr } from "./model";

/**
 * A Clog (combined log) is an onchain event affecting a Daimo account. Each
 * Clog corresponds to an Ethereum event log. Usually--but not always--it is
 * also 1:1 with a Daimo userop.
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
export type Clog = TransferClog | KeyRotationClog;

export type TransferClog = TransferSwapClog | PaymentLinkClog;

/**
 * Fetched data for a pending userop or sponsored transaction. Set exactly one
 * of (opHash, txHash) to uniquely identify a pending user action.
 */
export type PendingOp = {
  opHash?: Hex;
  txHash?: Hex;
  inviteCode?: string;
};

/**
 * Original (non-home-coin) inbound transfer, for an inbound swap or inbound
 * cross-chain transfer.
 */
export type PreSwapTransfer = {
  coin: ForeignToken;
  amount: BigIntStr; // in native unit of the token
  from: Address;
};

/**
 * Non-home-coin outbound transfer, for an outbound swap or outbound
 * cross-chain transfer.
 */
export type PostSwapTransfer = {
  coin: ForeignToken; // coin contains chainId
  amount: BigIntStr; // in native unit of the token
  to: Address;
};

/**
 * Represents a transfer of the same tokens from one address to another on the
 * same chain (a.k.a. same coins, same chain).
 *
 * There's a surprising amount of complexity to the state of a transfer.
 *
 * - Daimo transfers start out as a `PENDING` user op.
 *   The op goes through a lifecycle of pending (bundler has accepted, but not
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
export interface TransferSwapClog extends ClogBase {
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

  /** Original amount before swap to home coin */
  preSwapTransfer?: PreSwapTransfer;

  /** Output amount after swap from home coin */
  postSwapTransfer?: PostSwapTransfer;

  /** Remote transfer data associated with this transfer. e.g. Landline, Tron */
  offchainTransfer?: OffchainTransfer;
}

export interface PaymentLinkClog extends ClogBase {
  type: "createLink" | "claimLink";

  from: Address;
  to: Address;

  /** TODO: use bigint? Unnecessary for USDC. MAX_SAFE_INT = $9,007,199,254 */
  amount: number;

  noteStatus: DaimoNoteStatus;

  /** Userop nonce, if this link occurred in a userop */
  nonceMetadata?: Hex;

  /** Memo from the sender, if present */
  memo?: string;
}

/** A transfer that happens offchain or on a non-Daimo chain (e.g. TRON). */
export interface OffchainTransfer {
  type: "landline"; // future: "tron-bridge", ...

  transferType: "deposit" | "withdrawal";
  status: "processing" | "completed" | "failed" | "returned";
  statusMessage?: string;

  /** Remote account ID */
  accountID: string;
  /** Remote transfer ID, if available */
  transferID?: string;

  /** Unix seconds. Time the remote transfer was initiated */
  timeStart: number;
  /** Unix seconds. Time the remote transfer was expected to complete */
  timeExpected?: number;
  /** Unix seconds. Time the remote transfer was completed */
  timeFinish?: number;
}

/**
 * Represents a token swap between two accounts on the same chain.
 * Same chain, different coins.
 *
 * A token swap can be inbound swap (e.g. a Daimo account receives a foreign
 * token transfer in their inbox) or outbound swap (e.g. account Alice sends a
 * foreign token transfer to Bob).
 */
// export interface SwapClog extends ClogBase {
//   type: "inboundSwap" | "outboundSwap";

//   from: Address;
//   to: Address;

//   /** TODO: use bigint? Unnecessary for USDC. MAX_SAFE_INT = $9,007,199,254 */
//   amount: number; // amount that affects the user

//   /** "Other" coin involved in the swap (i.e. not homeCoin) */
//   coinOther: ForeignToken;

//   /** Amount of the coinOther in the swap (in native unit of coinOther)
//    * Uses BigIntStr to avoid number type overflows */
//   amountOther: BigIntStr;

//   /** Userop nonce, if this transfer occurred in a userop */
//   nonceMetadata?: Hex;

//   /** Memo, user-generated text for the transfer */
//   memo?: string;
// }

export interface KeyRotationClog extends ClogBase {
  type: "keyRotation";

  slot: number;
  rotationType: "add" | "remove";
}

interface ClogBase {
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
export function getDisplayFromTo(op: TransferClog): [Address, Address] {
  if (op.type === "transfer") {
    const from = op.preSwapTransfer?.from || op.from;
    const to = op.postSwapTransfer?.to || op.to;
    return [from, to];
  } else if (op.type === "claimLink" || op.type === "createLink") {
    // Self-transfer via payment link shows up as two payment link transfers
    if (op.noteStatus.claimer?.addr === op.noteStatus.sender.addr) {
      return [op.from, op.to];
    } else {
      return [
        op.noteStatus.sender.addr,
        op.noteStatus.claimer ? op.noteStatus.claimer.addr : op.to,
      ];
    }
  } else {
    // Swaps (outbound or inbound).
    return [op.from, op.to];
  }
}

export type TransferClogType =
  | "transfer"
  | "createLink"
  | "claimLink"
  | "landline";

export function getTransferClogType(clog: TransferClog): TransferClogType {
  if (clog.type === "createLink" || clog.type === "claimLink") {
    return clog.type;
  } else if (clog.type === "transfer") {
    return clog.offchainTransfer ? clog.offchainTransfer.type : "transfer";
  } else {
    throw Error(`Unknown clog type: ${clog.type}`);
  }
}

export type TransferClogStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "finalized"
  | "failed"
  | "expired";

/** Returns a combined onchain + offchain transfer status. */
export function getTransferClogStatus(clog: TransferClog): TransferClogStatus {
  const { offchainTransfer } = clog as TransferSwapClog;
  if (clog.status === "confirmed" && offchainTransfer != null) {
    // Show status of offchain transfer
    const offchainStatus = offchainTransfer.status;
    if (offchainStatus === "returned") return "failed";
    if (offchainStatus === "completed") return "finalized";
    return offchainStatus;
  } else {
    // Show status of onchain transfer
    return clog.status;
  }
}
