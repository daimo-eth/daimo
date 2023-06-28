import { Address } from "viem";

/**
 * A Daimo operation. These are 1:1 with userops when done via Daimo, but can
 * also represent transfers from other sources.
 */
export type Op = TransferOp;

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
 *   (For an optimistic rollup, a userop is arguably not finalized till the
 *   challenge period is up; an L2 node can be 100% certain that a given op is
 *   final after ~6 minutes (valid L2 root included in finalized L1 block) but
 *   anyone not running an L2 node has to wait a ~week to be sure.)
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
export interface TransferOp extends OpBase {
  type: "transfer";

  from: Address;
  to: Address;

  /** TODO: use bigint? Unnecessary for USDC. MAX_SAFE_INT = $9,007,199,254 */
  amount: number;
}

interface OpBase {
  /** Unix seconds. For PENDING, time of bundler accept. Then, block time. */
  timestamp: number;

  /** Every transfer ends up "finalized" or "failed" */
  status: OpStatus;

  /* Only set for Daimo transfers */
  opHash?: string;

  /* Below are only set once we have a Transfer event. */
  txHash?: string;
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;
}

export type OpStatus = "pending" | "confirmed" | "failed" | "finalized";
