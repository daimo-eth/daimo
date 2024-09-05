import { ForeignToken } from "@daimo/contract";
import { Address, Hex } from "viem";
import { z } from "zod";

import { DaimoLinkNote } from "./daimoLink";
import { EAccount } from "./eAccount";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

// Don't edit these for backcompat
export enum AddrLabel {
  Faucet = "team daimo",
  PaymentLink = "payment link",
  RequestLink = "request link",
  Paymaster = "fee",
  Coinbase = "coinbase",
  Relay = "relay.link",
  LiFi = "li.fi bridge",
  UniswapETHPool = "swapped ETH",
  Binance = "binance",
  FastCCTP = "cross-chain",
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
  sortId: z.number().optional(),
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

export type TagRedirectEvent = {
  time: number;
  tag: string;
  link: string;
};

export const zCreateInviteLinkArgs = z.object({
  code: z.string(),
  bonusDollarsInvitee: z.number(),
  bonusDollarsInviter: z.number(),
  maxUses: z.number(),
  inviter: z.string(),
});

export type CreateInviteLinkArgs = z.infer<typeof zCreateInviteLinkArgs>;

// TODO: fromAcc and receivedAt are unknown for native ETH
export interface SwapQuery {
  fromCoin: ForeignToken;
  fromAmount: BigIntStr; // in native unit of the token
  fromAcc: EAccount;
  receivedAt: number;
  cacheUntil: number; // Cache expiration time, prompts clients to refresh quote after this time
  toCoin: Address; // for example, native USDC
  execDeadline: number; // Onchain execution deadline -- swap may fail after this time
}

export type ProposedSwap = SwapQuery & {
  routeFound: true;
  toAmount: number; // for example, USDC units (*quoted*, not exec'd)
  execRouterAddress: Address;
  execCallData: Hex;
  execValue: Hex;
};

type SwapNoRoute = SwapQuery & {
  routeFound: false;
};

export type SwapQueryResult = SwapNoRoute | ProposedSwap;

export type PlatformType = "ios" | "android" | "other";

export interface SuggestedAction {
  id: string;
  icon?: string;
  title: string;
  subtitle: string;
  url: string;
}
