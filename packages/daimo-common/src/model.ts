import { Address, Hex } from "viem";
import { z } from "zod";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

export enum AddrLabel {
  Faucet = "faucet",
  PaymentLink = "payment link",
  Paymaster = "fee",
}

/** Subset of EAccount for Daimo accounts, which always have a name. */
export interface DAccount {
  addr: Address;
  name: string;
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

// TODO: use this in place of string / `${number}` everywhere applicable
export type DollarStr = `${number}`;

export const zTrackedRequest = z.object({
  requestId: zBigIntStr,
  amount: zBigIntStr,
});

export type TrackedRequest = z.infer<typeof zTrackedRequest>;

export const zKeyData = z.object({
  pubKey: zHex, // DER Format
  addedAt: z.number(),
  removedAt: z.number().optional(),
  slot: z.number(),
  lastUsedAt: z.number().optional(),
});

export type KeyData = z.infer<typeof zKeyData>;
