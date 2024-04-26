import { Address, Hex } from "viem";
import { z } from "zod";

import { DaimoLinkNote } from "./daimoLink";
import { EAccount } from "./eAccount";
import { ForeignCoin } from "./foreignCoin";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

export enum AddrLabel {
  Faucet = "team daimo",
  PaymentLink = "payment link",
  RequestLink = "request link",
  Paymaster = "fee",
  Coinbase = "coinbase",
  Relay = "relay.link",
  UniswapETHPool = "swapped ETH",
}

/** Subset of EAccount for Daimo accounts, which always have a name. */
export interface DAccount {
  addr: Address;
  name: string;
}

export const zHex = z
  .string()
  .regex(/^0x[0-9a-f]*$/i)
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

export const zInviteCodeStr = z.string().regex(/^[a-z][a-z0-9-]{2,24}$/i);

export const zTrackedRequest = z.object({
  requestId: zBigIntStr,
  amount: zBigIntStr,
});

export type TrackedRequest = z.infer<typeof zTrackedRequest>;

export interface TrackedNote extends DaimoLinkNote {
  opHash?: Hex;
}

export const zKeyData = z.object({
  pubKey: zHex, // DER Format
  addedAt: z.number(),
  slot: z.number(),
});

export type KeyData = z.infer<typeof zKeyData>;

export const zUserOpHex = z.object({
  sender: zAddress,
  nonce: zHex,
  initCode: zHex,
  callData: zHex,
  callGasLimit: zHex,
  verificationGasLimit: zHex,
  preVerificationGas: zHex,
  maxFeePerGas: zHex,
  maxPriorityFeePerGas: zHex,
  paymasterAndData: zHex,
  signature: zHex,
});

export type UserOpHex = z.infer<typeof zUserOpHex>;

export const zRecommendedExchange = z.object({
  title: z.string().optional(),
  cta: z.string(),
  logo: z.string().optional(),
  url: z.string(),
});

export type RecommendedExchange = z.infer<typeof zRecommendedExchange>;

export const zEmailAddress = z.string().email();

export type EmailAddress = z.infer<typeof zEmailAddress>;

// From https://stackoverflow.com/a/29767609
const phoneNumberRegex = new RegExp(
  /^\+?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,6}$/im
);

export const zPhoneNumber = z.string().regex(phoneNumberRegex);

export type PhoneNumber = z.infer<typeof zPhoneNumber>;

export interface TagRedirectEvent {
  time: number;
  tag: string;
  link: string;
}

export const zCreateInviteLinkArgs = z.object({
  code: z.string(),
  bonusDollarsInvitee: z.number(),
  bonusDollarsInviter: z.number(),
  maxUses: z.number(),
  inviter: z.string(),
});

export type CreateInviteLinkArgs = z.infer<typeof zCreateInviteLinkArgs>;

// TODO: fromAcc and receivedAt are unknown for native ETH
export interface ProposedSwap {
  fromCoin: ForeignCoin;
  fromAmount: BigIntStr; // in native unit of the token
  fromAcc: EAccount;
  receivedAt: number;
  toAmount: number; // in native USDC units
  expiresAt: number;
  execRouterAddress: Address;
  execCallData: Hex;
  execValue: Hex;
}
