import { Address, Hex } from "viem";
import { z } from "zod";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

// TODO: renamed to EAccount = superset of Daimo accounts, DAccount
export const zEAccount = z.object({
  addr: zAddress,
  /** Daimo account name */
  name: z.string().optional(),
  /** Label for special addresse like the faucet */
  label: z.string().optional(),
  /** ENS name */
  ensName: z.string().optional(),
});

/** EAccount represents any Ethereum address + display name(s). */
export type EAccount = z.infer<typeof zEAccount>;

/** Subset of EAccount for Daimo accounts, which always have a name. */
export interface DAccount {
  addr: Address;
  name: string;
}

/** Gets a display name or 0x... address contraction. */
export function getAccountName(acc: EAccount): string {
  const str = acc.name || acc.label || acc.ensName;
  if (str) return str;

  const { addr } = acc;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

/** True if account has a display name, false if bare address. */
export function hasAccountName(acc: EAccount): boolean {
  return !!(acc.name || acc.label || acc.ensName);
}

export const zHex = z
  .string()
  .regex(/^0x([0-9a-f]{2})*$/i)
  .refine((s): s is Hex => true);

export const zBigIntStr = z
  .string()
  .regex(/^[0-9]+$/i)
  .refine((s): s is BigIntStr => true);

export type BigIntStr = `${bigint}`;

export const zDollarStr = z
  .string()
  .regex(/^\d+(\.\d+)?$/i)
  .refine((s): s is DollarStr => true);

export type DollarStr = `${number}`;

export const zTransferLogSummary = z.object({
  from: zAddress,
  to: zAddress,
  amount: zBigIntStr,
  blockHash: zHex,
  blockNum: z.number(),
  txHash: zHex,
  logIndex: z.number(),
  nonceMetadata: zHex,
});

export type TransferLogSummary = z.infer<typeof zTransferLogSummary>;

export const zTrackedRequest = z.object({
  requestId: zBigIntStr,
  amount: zBigIntStr,
});

export type TrackedRequest = z.infer<typeof zTrackedRequest>;

export const zKeyData = z.object({
  key: zHex, // DER Format
  addedAt: z.number(),
  removedAt: z.number().optional(),
  keyIndex: z.number().optional(),
  // TODO lastUsedAt?: bigint;
});

export type KeyData = z.infer<typeof zKeyData>;
