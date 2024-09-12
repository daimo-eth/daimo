import {
  AddrLabel,
  BigIntStr,
  DaimoNoteState,
  DaimoRequestState,
  DollarStr,
  OpStatus,
} from "@daimo/common";
import { Address, Hex } from "viem";

//
// Stored types used inside of StoredModels.
//
// Do not edit these except to add new OPTIONAL fields or enums.
// Anything else requires a new version and a migration.
// This file contains current types. For old versions, see storedTypeMigrations.
//

export type StoredV16Clog = StoredV16TransferClog | StoredV15PaymentLinkClog;

interface StoredV16TransferClog {
  timestamp: number;
  status: OpStatus;
  opHash?: Hex;
  txHash?: Hex;
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;
  feeAmount?: number;
  type: "transfer";
  from: Address;
  to: Address;
  amount: number;
  nonceMetadata?: Hex;
  requestStatus?: StoredV15DaimoRequestV2Status;
  memo?: string;

  preSwapTransfer?: {
    coin: StoredV16ForeignCoin;
    amount: BigIntStr;
    from: Address;
  };

  postSwapTransfer?: {
    coin: StoredV16ForeignCoin;
    amount: BigIntStr;
    to: Address;
  };
}

export interface StoredV15PaymentLinkClog {
  timestamp: number;
  status: OpStatus;
  opHash?: Hex;
  txHash?: Hex;
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;
  feeAmount?: number;
  type: "createLink" | "claimLink";
  from: Address;
  to: Address;
  amount: number;
  noteStatus: StoredV15DaimoNoteStatus;
  nonceMetadata?: Hex;
  memo?: string;
}

export interface StoredV15KeyRotationClog {
  timestamp: number;
  status: OpStatus;
  opHash?: Hex;
  txHash?: Hex;
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;
  feeAmount?: number;
  type: "keyRotation";
  slot: number;
  rotationType: "add" | "remove";
}

interface StoredV15DaimoNoteStatus {
  link: StoredV15DaimoLinkNote | StoredV15DaimoLinkNoteV2;
  status: DaimoNoteState;
  sender: StoredV15EAccount;
  id?: string;
  contractAddress: Address;
  ephemeralOwner?: Address;
  claimer?: StoredV15EAccount;
  dollars: `${number}`;
  memo?: string;
}

export type StoredV15EAccount = {
  addr: Address;
  name?: string;
  timestamp?: number;
  inviter?: Address;
  label?: AddrLabel;
  ensName?: string;
  linkedAccounts?: {
    type: "farcaster";
    message: string;
    id: string;
    fid: number;
    custody: Address;
    signature: Hex;
    verifications: string[];
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    bio?: string;
  }[];
  profilePicture?: string;
};

export interface StoredV15KeyData {
  pubKey: Hex;
  addedAt: number;
  slot: number;
}

export interface StoredV15RecommendedExchange {
  cta: string;
  url: string;
  title?: string;
  logo?: string;
  sortId?: number;
}

export interface StoredV15SuggestedAction {
  id: string;
  icon?: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface StoredV15ChainGasConstants {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  preVerificationGas: string;
  estimatedFee: number;
  paymasterAddress: Hex;
}

export interface StoredV15LinkedAccount {
  type: "farcaster";
  message: string;
  id: string;
  fid: number;
  custody: Hex;
  signature: Hex;
  verifications: string[];
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
}

export interface StoredV15DaimoInviteCodeStatus {
  link: { type: "invite"; code: string };
  createdAt: number;
  isValid: boolean;
  usesLeft?: number;
  bonusDollarsInvitee?: number;
  bonusDollarsInviter?: number;
  inviter?: StoredV15EAccount;
}

export interface StoredV15DaimoRequestV2Status {
  link: StoredV15DaimoLinkRequestV2;
  recipient: StoredV15EAccount;
  creator?: StoredV15EAccount;
  status: DaimoRequestState;
  metadata: Hex;
  createdAt: number;
  fulfilledBy?: StoredV15EAccount;
  isValidInvite?: boolean;
  expectedFulfiller?: StoredV15EAccount;
  updatedAt?: number;
  memo?: string;
}

interface StoredV15DaimoLinkRequestV2 {
  type: "requestv2";
  id: string;
  recipient: string;
  dollars: DollarStr;
  memo?: string;
}

export interface StoredV15DaimoLinkNote {
  type: "note";
  previewSender: string;
  previewDollars: DollarStr;
  ephemeralOwner: Address;
  ephemeralPrivateKey?: Hex;
}

export interface StoredV15DaimoLinkNoteV2 {
  type: "notev2";
  sender: string;
  dollars: DollarStr;
  id: string;
  seed?: string;
}

export interface StoredV15CurrencyExchangeRate {
  name: string;
  symbol: string;
  currency: string;
  decimals: number;
  rateUSD: number;
}

export interface StoredV16ProposedSwap {
  fromCoin: StoredV16ForeignCoin;
  fromAmount: BigIntStr;
  fromAcc: StoredV15EAccount;
  receivedAt: number;
  cacheUntil: number;
  toCoin: Address;
  execDeadline: number;
  routeFound: true;
  toAmount: number;
  execRouterAddress: Address;
  execCallData: Hex;
  execValue: Hex;
}

interface StoredV16ForeignCoin {
  chainId: number;
  token: Address;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export interface StoredV15LandlineAccount {
  daimoAddress: Address;
  landlineAccountUuid: string;
  bankName: string;
  bankLogo: string | null;
  accountName: string;
  accountNumberLastFour: string;
  bankCurrency: string;
  liquidationAddress: Address;
  liquidationChain: string;
  liquidationCurrency: string;
  createdAt: string;
}
