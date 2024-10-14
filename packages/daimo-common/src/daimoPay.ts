import { ForeignToken } from "@daimo/contract";
import { base58 } from "@scure/base";
import {
  Address,
  bytesToBigInt,
  getAddress,
  Hex,
  numberToBytes,
  zeroAddress,
} from "viem";
import z from "zod";

import { BigIntStr, zAddress } from "./model";

// lifecycle: waiting payment -> processed.
export enum DaimoPayOrderStatusSource {
  WAITING_PAYMENT = "waiting_payment",
  PENDING_PROCESSING = "pending_processing",
  PROCESSED = "processed",
}

// lifecycle: pending -> fast-finished (optionally) -> claimed
export enum DaimoPayOrderStatusDest {
  PENDING = "pending",
  FAST_FINISHED = "fast_finished",
  CLAIMED = "claimed",
}

export enum DaimoPayOrderMode {
  SALE = "sale", // product or item sale
  CHOOSE_AMOUNT = "choose_amount", // let the user specify the amount to pay
  HYDRATED = "hydrated", // once hydrated, the order is final and all parameters are known and immutable
}

export type DaimoPayOrderUpdate =
  | DaimoPayOrderMode
  | DaimoPayOrderStatusSource
  | DaimoPayOrderStatusDest;

export interface DaimoPayOrderItem {
  name: string;
  description: string;
  image?: string;
}

// NOTE: be careful to modify this type only in backward-compatible ways.
//       Add OPTIONAL fields, etc. Anything else requires a migration.
export const zDaimoPayOrderMetadata = z.object({
  intent: z
    .string()
    .describe("Title verb, eg 'Preorder', 'Check out', 'Deposit'."),
  items: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        image: z.string().optional(),
      }),
    )
    .describe("Details about what's being ordered, donated, deposited, etc."),
  payer: z
    .object({
      preferredChains: z
        .array(z.number())
        .optional()
        .describe(
          "Preferred chain IDs, in descending order. Any assets the user owns on preferred chains will appear first. Defaults to destination chain.",
        ),
      preferredTokens: z
        .array(
          z.object({
            chain: z.number(),
            address: zAddress.transform((a) => getAddress(a)),
          }),
        )
        .optional()
        .describe(
          "Preferred tokens, in descending order. Any preferred assets the user owns will appear first. Defaults to destination token.",
        ),
      paymentOptions: z
        .array(z.string())
        .optional()
        .describe(
          "Payment options like Coinbase, Binance, etc. Defaults to all available options.",
        ),
    })
    .optional()
    .describe(""),
});

export type DaimoPayOrderMetadata = z.infer<typeof zDaimoPayOrderMetadata>;

export type DaimoPayDehydratedOrder = {
  mode: DaimoPayOrderMode.SALE | DaimoPayOrderMode.CHOOSE_AMOUNT;
  id: bigint;
  destFinalCallTokenAmount: DaimoPayTokenAmount;
  destFinalCall: OnChainCall;
  destNonce: bigint;
  redirectUri: string | null;
  orgId: string | null;
  createdAt: number | null;
  metadata: DaimoPayOrderMetadata;
};

export type DaimoPayHydratedOrder = {
  mode: DaimoPayOrderMode.HYDRATED;
  id: bigint;
  handoffAddr: Address;
  destMintTokenAmount: DaimoPayTokenAmount;
  destFinalCallTokenAmount: DaimoPayTokenAmount;
  destFinalCall: OnChainCall;
  destRefundAddr: Address;
  destNonce: bigint;
  sourceFulfillerAddr: Address | null;
  sourceTokenAmount: DaimoPayTokenAmount | null;
  sourceInitiateTxHash: Hex | null;
  sourceStartTxHash: Hex | null;
  sourceStatus: DaimoPayOrderStatusSource;
  destStatus: DaimoPayOrderStatusDest;
  destFastFinishTxHash: Hex | null;
  destClaimTxHash: Hex | null;
  redirectUri: string | null;
  orgId: string | null;
  createdAt: number | null;
  metadata: DaimoPayOrderMetadata;
};

export type DaimoPayHydratedOrderWithoutHandoffAddr = Omit<
  DaimoPayHydratedOrder,
  "handoffAddr"
>;

export type DaimoPayOrder = DaimoPayDehydratedOrder | DaimoPayHydratedOrder;

export type ExternalPaymentOptionMetadata = {
  id: ExternalPaymentOptions;
  cta: string;
  logoURI: string;
  paymentToken: DaimoPayToken;
};

export type ExternalPaymentOptionData = {
  url: string;
  waitingMessage: string;
};

export enum ExternalPaymentOptions {
  Daimo = "Daimo",
  Coinbase = "Coinbase",
  RampNetwork = "RampNetwork",
  Binance = "Binance",
}

export interface DaimoPayToken extends ForeignToken {
  usd: number; // per unit price in dollars, example 2300 (USD) for WETH
  quoteTimestamp: number;
  quoteBlockNumber: number;
  displayDecimals: number; // TODO, human friendly number of decimals for the token
  fiatSymbol?: string; // e.g. $ for USDC/USDT/DAI, € for EUROC, etc
}

export interface DaimoPayTokenAmount {
  token: DaimoPayToken;
  amount: BigIntStr;
  usd: number; // amount in dollars
}

export type OnChainCall = {
  to: Address;
  data: Hex;
  value: bigint;
};

export const emptyOnChainCall: OnChainCall = {
  to: zeroAddress,
  data: "0x",
  value: 0n,
};

// base58 encoded bigint
const zDaimoPayOrderID = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]+$/);

export type DaimoPayOrderID = z.infer<typeof zDaimoPayOrderID>;

export function readDaimoPayOrderID(id: string): bigint {
  return bytesToBigInt(base58.decode(id));
}

export function writeDaimoPayOrderID(id: bigint): string {
  return base58.encode(numberToBytes(id));
}

export const zUUID = z.string().uuid();

export type UUID = z.infer<typeof zUUID>;

export type PaymentStartedEvent = {
  type: "payment_started";
  paymentId: DaimoPayOrderID;
  chainId: number;
  txHash: Hex;
};

export type PaymentCompletedEvent = {
  type: "payment_completed";
  paymentId: DaimoPayOrderID;
  chainId: number;
  txHash: Hex;
};

export type PaymentBouncedEvent = {
  type: "payment_bounced";
  paymentId: DaimoPayOrderID;
  chainId: number;
  txHash: Hex;
};

export type WebhookEventBody =
  | PaymentStartedEvent
  | PaymentCompletedEvent
  | PaymentBouncedEvent;

export interface WebhookEndpoint {
  id: UUID;
  orgId: UUID;
  url: string;
  token: string;
  createdAt: Date;
  deletedAt: Date | null;
}

// Lifecycle: Pending (just created) -> (if failing) Retrying (exponential backoff) -> Successful or Failed
export enum WebhookEventStatus {
  PENDING = "pending", // waiting to be delivered
  RETRYING = "retrying", // currently in exponential backoff queue
  SUCCESSFUL = "successful", // successfully delivered
  FAILED = "failed", // gave up after retrying
}

export interface WebhookEvent {
  id: UUID;
  endpoint: WebhookEndpoint;
  body: WebhookEventBody;
  status: WebhookEventStatus;
  deliveries: WebhookDelivery[];
  createdAt: Date;
}

export interface WebhookDelivery {
  id: UUID;
  eventId: UUID;
  httpStatus: number | null;
  body: string | null;
  createdAt: Date;
}
