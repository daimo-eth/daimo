import { ForeignToken } from "@daimo/contract";
import { base58 } from "@scure/base";
import { Address, bytesToBigInt, Hex, numberToBytes, zeroAddress } from "viem";

import { BigIntStr } from "./model";

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

export interface DaimoPayOrderItem {
  name: string;
  description: string;
  image: string;
}

export type DaimoPayDehydratedOrder = {
  mode: DaimoPayOrderMode.SALE | DaimoPayOrderMode.CHOOSE_AMOUNT;
  id: bigint;
  destFinalCallTokenAmount: DaimoPayTokenAmount;
  destFinalCall: OnChainCall;
  destNonce: bigint;
  intent: string;
  itemsJson: string | null;
  paymentOptionsJson: string;
  redirectUri: string | null;
  orgId: string | null;
  createdAt: number | null;
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
  intent: string;
  itemsJson: string | null;
  paymentOptionsJson: string;
  redirectUri: string | null;
  orgId: string | null;
  createdAt: number | null;
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

export function readEncodedDaimoPayID(id: string): bigint {
  return bytesToBigInt(base58.decode(id));
}

export function writeEncodedDaimoPayID(id: bigint): string {
  return base58.encode(numberToBytes(id));
}
