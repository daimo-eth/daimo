import { Address, Hex } from "viem";
import { z } from "zod";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

export const zNamedAccount = z.object({
  addr: zAddress,
  name: z.string().optional(),
  // TODO: add optional reverse-lookup ENS name
  // ensName: z.string().optional()
});

/** NamedAccount represents any Ethereum address + onchain display name(s). */
export type NamedAccount = z.infer<typeof zNamedAccount>;

/** Subset of NamedAccount for Daimo accounts, which always have a name. */
export interface NamedDaimoAccount {
  addr: Address;
  name: string;
}

/** Gets a bare string name or 0x... address contraction. */
export function getAccountName(acc: NamedAccount): string {
  if (acc.name) return acc.name;
  const { addr } = acc;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
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
});

export type TransferLogSummary = z.infer<typeof zTransferLogSummary>;
