import { SuggestedAction } from "@daimo/api";
import {
  ChainGasConstants,
  CurrencyExchangeRate,
  DaimoInviteCodeStatus,
  DaimoLinkNote,
  DaimoLinkNoteV2,
  DaimoRequestV2Status,
  DisplayOpEvent,
  EAccount,
  KeyData,
  KeyRotationOpEvent,
  LinkedAccount,
  ProposedSwap,
  RecommendedExchange,
  TrackedRequest,
  TransferOpEvent,
  assert,
  now,
} from "@daimo/common";
import { DaimoChain, daimoPaymasterV2Address } from "@daimo/contract";
import { Address, Hex, getAddress } from "viem";

import { StoredModel } from "./storedModel";
import { env } from "../logic/env";
import { LandlineAccount } from "../view/screen/DepositScreen";

/**
 * Singleton account key.
 * Will be a series if/when we support multiple accounts.
 */
export const defaultEnclaveKeyName =
  process.env.DAIMO_APP_VARIANT === "dev" ? "daimo-dev-12" : "daimo-12";

/**
 * Device API key name: serves as poor man's device attestation.
 * Fixed key created once and never deleted -- used as an alternate to
 * device attestations.
 */
export const deviceAPIKeyName =
  process.env.DAIMO_APP_VARIANT === "dev" ? "daimo-apikey-dev" : "daimo-apikey";

/** Account data stored on device. */
export type Account = {
  /** Local device signing key name */
  enclaveKeyName: string;
  /** Local device signing DER pubkey */
  enclavePubKey: Hex;
  /** Daimo name, registered onchain */
  name: string;
  /** Contract wallet address */
  address: Address;

  /** Home chain where we hold our balance */
  homeChainId: number;
  /** Home ERC-20 token where we hold our balance */
  homeCoinAddress: Address;

  /** Latest sync block number */
  lastBlock: number;
  /** Latest sync time */
  lastBlockTimestamp: number;
  /** Balance as of lastBlock */
  lastBalance: bigint;

  /** The latest finalized block as of the most recent sync. */
  lastFinalizedBlock: number;
  /** Transfers to/from other Daimo accounts & other Ethereum accounts. */
  recentTransfers: DisplayOpEvent[];
  /** Names for each Daimo account we've interacted with. */
  namedAccounts: EAccount[];
  /** P-256 keys authorised by the Daimo account, in DER format */
  accountKeys: KeyData[];
  /** Pending changes to authorised keys  */
  pendingKeyRotation: KeyRotationOpEvent[];

  /** Current gas and paymaster related constants */
  chainGasConstants: ChainGasConstants;

  /** Local device push token, if permission was granted. */
  pushToken: string | null;

  /** List of URLs for exchanges to show on deposit screen */
  recommendedExchanges: RecommendedExchange[];
  /** Suggested actions. Dismissable, at most 1 displayed. */
  suggestedActions: SuggestedAction[];
  /** IDs of suggested actions that have been dismissed */
  dismissedActionIDs: string[];

  /** Linked accounts (via mutual sig) for rich profiles, eg Farcaster. */
  linkedAccounts: LinkedAccount[];
  /** Profile picture */
  profilePicture?: string;

  /** Invite link (where the user is the inviter) and its status */
  inviteLinkStatus: DaimoInviteCodeStatus | null;
  /** Invitees of user */
  invitees: EAccount[];

  /** True once we've completed onboarding. */
  isOnboarded: boolean;

  /** Request data for notifications */
  notificationRequestStatuses: DaimoRequestV2Status[];

  /** Track read notifications, todo: sync with server in future */
  lastReadNotifTimestamp: number;

  /** Proposed swaps from non-home coin balances -> home coin balance */
  proposedSwaps: ProposedSwap[];

  /** Exchange rates for non-USD currencies, just for amount entry */
  exchangeRates: CurrencyExchangeRate[];

  /** Payment links sent, but not yet claimed */
  sentPaymentLinks: DaimoLinkNoteV2[];

  /** Session key used to authenticate to the Landline onramp/offramp app **/
  landlineSessionKey: string;
  /** Bank accounts connected to the Landline onramp/offramp app **/
  landlineAccounts: LandlineAccount[];
};

export function toEAccount(account: Account): EAccount {
  return {
    addr: account.address,
    name: account.name,
    profilePicture: account.profilePicture,
  };
}

// Pre-v9 chain gas constants
type ChainGasConstantsV8 = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedFee: number;
  paymasterAddress: Address;
};

interface AccountV8 extends StoredModel {
  storageVersion: 8;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  trackedRequests: TrackedRequest[];
  pendingNotes: DaimoLinkNote[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];

  chainGasConstants: ChainGasConstantsV8;

  pushToken: string | null;
}

interface AccountV9 extends StoredModel {
  storageVersion: 9;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  trackedRequests: TrackedRequest[];
  pendingNotes: DaimoLinkNote[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;
}

interface AccountV10 extends StoredModel {
  storageVersion: 10;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  trackedRequests: TrackedRequest[];
  pendingNotes: DaimoLinkNote[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];
  recommendedExchanges: RecommendedExchange[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;
}

interface AccountV11 extends StoredModel {
  storageVersion: 11;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  trackedRequests: TrackedRequest[];
  pendingNotes: DaimoLinkNote[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];
  recommendedExchanges: RecommendedExchange[];
  suggestedActions: SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;
}

interface AccountV12 extends StoredModel {
  storageVersion: 12;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: DisplayOpEvent[];
  trackedRequests: TrackedRequest[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];
  recommendedExchanges: RecommendedExchange[];
  suggestedActions: SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;

  linkedAccounts?: LinkedAccount[];
}

interface AccountV13 extends StoredModel {
  storageVersion: 13;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: DisplayOpEvent[];
  trackedRequests: TrackedRequest[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];
  recommendedExchanges: RecommendedExchange[];
  suggestedActions: SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;
  linkedAccounts: LinkedAccount[];
  inviteLinkStatus: DaimoInviteCodeStatus | null;
  invitees: EAccount[];

  isOnboarded?: boolean;
}

interface AccountV14 extends StoredModel {
  storageVersion: 14;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: DisplayOpEvent[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];
  recommendedExchanges: RecommendedExchange[];
  suggestedActions: SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;
  linkedAccounts: LinkedAccount[];
  inviteLinkStatus: DaimoInviteCodeStatus | null;
  invitees: EAccount[];

  isOnboarded?: boolean;

  notificationRequestStatuses: DaimoRequestV2Status[];
  lastReadNotifTimestamp: number;
  proposedSwaps: ProposedSwap[];
  exchangeRates?: CurrencyExchangeRate[];
  sentPaymentLinks?: DaimoLinkNoteV2[];
}

interface AccountV15 extends StoredModel {
  storageVersion: 14;

  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: string;

  homeChainId: number;
  homeCoinAddress: Address;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: DisplayOpEvent[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  pendingKeyRotation: KeyRotationOpEvent[];
  recommendedExchanges: RecommendedExchange[];
  suggestedActions: SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: ChainGasConstants;

  pushToken: string | null;
  linkedAccounts: LinkedAccount[];
  inviteLinkStatus: DaimoInviteCodeStatus | null;
  invitees: EAccount[];

  isOnboarded?: boolean;

  notificationRequestStatuses: DaimoRequestV2Status[];
  lastReadNotifTimestamp: number;
  proposedSwaps: ProposedSwap[];
  exchangeRates?: CurrencyExchangeRate[];
  sentPaymentLinks?: DaimoLinkNoteV2[];

  landlineSessionKey: string;
  landlineAccounts: LandlineAccount[];
}

export function parseAccount(accountJSON?: string): Account | null {
  if (!accountJSON) return null;
  const model = JSON.parse(accountJSON) as StoredModel;

  // Migrations
  // Delete V1-78 testnet accounts. Re-onboard to latest account with paymasters.
  if (model.storageVersion < 8) {
    console.log(`[ACCOUNT] DROPPING v${model.storageVersion} account`);
    return null;
  }

  if (model.storageVersion === 8) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV8;
    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: [],
      recommendedExchanges: [],
      suggestedActions: [],
      dismissedActionIDs: [],

      chainGasConstants: { ...a.chainGasConstants, preVerificationGas: "0" },

      pushToken: a.pushToken,

      linkedAccounts: [],
      inviteLinkStatus: null,
      invitees: [],

      isOnboarded: true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 9) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV9;
    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: a.pendingKeyRotation,
      recommendedExchanges: [],
      suggestedActions: [],
      dismissedActionIDs: [],

      chainGasConstants: a.chainGasConstants,

      pushToken: a.pushToken,

      linkedAccounts: [],
      inviteLinkStatus: null,
      invitees: [],

      isOnboarded: true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 10) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV10;
    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: a.pendingKeyRotation,
      recommendedExchanges: a.recommendedExchanges,
      suggestedActions: [],
      dismissedActionIDs: [],

      chainGasConstants: a.chainGasConstants,

      pushToken: a.pushToken,

      linkedAccounts: [],
      inviteLinkStatus: null,
      invitees: [],

      isOnboarded: true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 11) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV11;

    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: a.pendingKeyRotation,
      recommendedExchanges: a.recommendedExchanges,
      suggestedActions: a.suggestedActions,
      dismissedActionIDs: a.dismissedActionIDs,

      chainGasConstants: a.chainGasConstants,

      pushToken: a.pushToken,

      linkedAccounts: [],
      inviteLinkStatus: null,
      invitees: [],

      isOnboarded: true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 12) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV12;

    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: a.pendingKeyRotation,
      recommendedExchanges: a.recommendedExchanges,
      suggestedActions: a.suggestedActions,
      dismissedActionIDs: a.dismissedActionIDs,

      chainGasConstants: a.chainGasConstants,

      pushToken: a.pushToken,
      linkedAccounts: [],
      inviteLinkStatus: null,
      invitees: [],

      isOnboarded: true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 13) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV13;

    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: a.pendingKeyRotation,
      recommendedExchanges: a.recommendedExchanges,
      suggestedActions: a.suggestedActions,
      dismissedActionIDs: a.dismissedActionIDs,

      chainGasConstants: a.chainGasConstants,

      pushToken: a.pushToken,

      linkedAccounts: a.linkedAccounts || [],
      inviteLinkStatus: a.inviteLinkStatus,
      invitees: a.invitees,

      isOnboarded: a.isOnboarded ?? true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 14) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as AccountV14;

    return {
      enclaveKeyName: a.enclaveKeyName,
      enclavePubKey: a.enclavePubKey,
      name: a.name,
      address: getAddress(a.address),

      homeChainId: a.homeChainId,
      homeCoinAddress: getAddress(a.homeCoinAddress),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,
      accountKeys: a.accountKeys,
      pendingKeyRotation: a.pendingKeyRotation,
      recommendedExchanges: a.recommendedExchanges,
      suggestedActions: a.suggestedActions,
      dismissedActionIDs: a.dismissedActionIDs,

      chainGasConstants: a.chainGasConstants,

      pushToken: a.pushToken,

      linkedAccounts: a.linkedAccounts || [],
      inviteLinkStatus: a.inviteLinkStatus,
      invitees: a.invitees,

      isOnboarded: a.isOnboarded ?? true,

      notificationRequestStatuses: [],
      lastReadNotifTimestamp: 0,
      proposedSwaps: [],
      exchangeRates: [],
      sentPaymentLinks: [],

      landlineSessionKey: "",
      landlineAccounts: [],
    };
  }

  assert(model.storageVersion === 15, "Unknown account storage version");
  const a = model as AccountV15;

  return {
    enclaveKeyName: a.enclaveKeyName,
    enclavePubKey: a.enclavePubKey,
    name: a.name,
    address: getAddress(a.address),

    homeChainId: a.homeChainId,
    homeCoinAddress: getAddress(a.homeCoinAddress),

    lastBalance: BigInt(a.lastBalance),
    lastBlock: a.lastBlock,
    lastBlockTimestamp: a.lastBlockTimestamp,
    lastFinalizedBlock: a.lastFinalizedBlock,

    recentTransfers: a.recentTransfers,
    namedAccounts: a.namedAccounts,
    accountKeys: a.accountKeys,
    pendingKeyRotation: a.pendingKeyRotation,
    recommendedExchanges: a.recommendedExchanges,
    suggestedActions: a.suggestedActions,
    dismissedActionIDs: a.dismissedActionIDs,

    chainGasConstants: a.chainGasConstants,

    pushToken: a.pushToken,

    linkedAccounts: a.linkedAccounts || [],
    inviteLinkStatus: a.inviteLinkStatus,
    invitees: a.invitees,

    isOnboarded: a.isOnboarded ?? true,

    notificationRequestStatuses: a.notificationRequestStatuses || [],
    lastReadNotifTimestamp: a.lastReadNotifTimestamp || 0,
    proposedSwaps: a.proposedSwaps || [],
    exchangeRates: a.exchangeRates || [],
    sentPaymentLinks: a.sentPaymentLinks || [],

    landlineSessionKey: a.landlineSessionKey || "",
    landlineAccounts: a.landlineAccounts || [],
  };
}

export function serializeAccount(account: Account | null): string {
  if (!account) return "";

  const model: AccountV14 = {
    storageVersion: 14,

    enclaveKeyName: account.enclaveKeyName,
    enclavePubKey: account.enclavePubKey,
    name: account.name,
    address: account.address,

    homeChainId: account.homeChainId,
    homeCoinAddress: account.homeCoinAddress,

    lastBalance: account.lastBalance.toString(),
    lastBlock: account.lastBlock,
    lastBlockTimestamp: account.lastBlockTimestamp,
    lastFinalizedBlock: account.lastFinalizedBlock,

    recentTransfers: account.recentTransfers,
    namedAccounts: account.namedAccounts,
    accountKeys: account.accountKeys,
    pendingKeyRotation: account.pendingKeyRotation,
    recommendedExchanges: account.recommendedExchanges,
    suggestedActions: account.suggestedActions,
    dismissedActionIDs: account.dismissedActionIDs,

    chainGasConstants: account.chainGasConstants,

    pushToken: account.pushToken,

    linkedAccounts: account.linkedAccounts,
    inviteLinkStatus: account.inviteLinkStatus,
    invitees: account.invitees,

    isOnboarded: account.isOnboarded,

    notificationRequestStatuses: account.notificationRequestStatuses,
    lastReadNotifTimestamp: account.lastReadNotifTimestamp,
    proposedSwaps: account.proposedSwaps,
    exchangeRates: account.exchangeRates,
    sentPaymentLinks: account.sentPaymentLinks,
  };

  return JSON.stringify(model);
}

export function createEmptyAccount(
  inputAccount: {
    enclaveKeyName: string;
    enclavePubKey: Hex;
    name: string;
    address: Address;
  },
  daimoChain: DaimoChain
): Account {
  return {
    ...inputAccount,

    homeChainId: env(daimoChain).chainConfig.chainL2.id,
    homeCoinAddress: env(daimoChain).chainConfig.tokenAddress,

    lastBalance: BigInt(0),
    lastBlockTimestamp: 0,
    lastBlock: 0,
    lastFinalizedBlock: 0,

    namedAccounts: [],
    recentTransfers: [],
    accountKeys: [
      {
        slot: 0,
        addedAt: now(),
        pubKey: inputAccount.enclavePubKey,
      },
    ],
    pendingKeyRotation: [],
    recommendedExchanges: [],
    suggestedActions: [],
    dismissedActionIDs: [],

    chainGasConstants: {
      maxPriorityFeePerGas: "0",
      maxFeePerGas: "0",
      estimatedFee: 0,
      paymasterAddress: daimoPaymasterV2Address,
      preVerificationGas: "0",
    },

    pushToken: null,

    linkedAccounts: [],
    inviteLinkStatus: null,
    invitees: [],

    isOnboarded: false,

    notificationRequestStatuses: [],
    lastReadNotifTimestamp: now(),
    proposedSwaps: [],
    exchangeRates: [],
    sentPaymentLinks: [],

    landlineSessionKey: "",
    landlineAccounts: [],
  };
}
