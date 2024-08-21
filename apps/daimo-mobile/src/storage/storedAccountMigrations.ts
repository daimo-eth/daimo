import { Address, Hex, getAddress } from "viem";

import { Account } from "./account";
import { StoredModel } from "./storedModel";
import {
  StoredV15Clog,
  StoredV15ProposedSwap,
  StoredV15TransferClog,
  migrateV15Clog,
  migrateV15ProposedSwaps,
} from "./storedTypeMigrations";
import {
  StoredV15ChainGasConstants,
  StoredV15CurrencyExchangeRate,
  StoredV15DaimoInviteCodeStatus,
  StoredV15DaimoLinkNote,
  StoredV15DaimoLinkNoteV2,
  StoredV15DaimoRequestV2Status,
  StoredV15EAccount,
  StoredV15KeyData,
  StoredV15KeyRotationClog,
  StoredV15LandlineAccount,
  StoredV15LinkedAccount,
  StoredV15RecommendedExchange,
  StoredV15SuggestedAction,
} from "./storedTypes";

//
// This file describes all old schema versions for locally-stored user accounts.
// Do not edit. Each old version specifies a migration to current account.
//

// Pre-v9 chain gas constants
type StoredV8ChainGasConstants = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedFee: number;
  paymasterAddress: Address;
};

type StoredV8TrackedRequest = {
  requestId: string;
  amount: string;
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
  recentTransfers: StoredV15TransferClog[];
  trackedRequests: StoredV8TrackedRequest[];
  pendingNotes: StoredV15DaimoLinkNote[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];

  chainGasConstants: StoredV8ChainGasConstants;

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
  recentTransfers: StoredV15TransferClog[];
  trackedRequests: StoredV8TrackedRequest[];
  pendingNotes: StoredV15DaimoLinkNote[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];

  chainGasConstants: StoredV15ChainGasConstants;

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
  recentTransfers: StoredV15TransferClog[];
  trackedRequests: StoredV8TrackedRequest[];
  pendingNotes: StoredV15DaimoLinkNote[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];
  recommendedExchanges: StoredV15RecommendedExchange[];

  chainGasConstants: StoredV15ChainGasConstants;

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
  recentTransfers: StoredV15TransferClog[];
  trackedRequests: StoredV8TrackedRequest[];
  pendingNotes: StoredV15DaimoLinkNote[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];
  recommendedExchanges: StoredV15RecommendedExchange[];
  suggestedActions: StoredV15SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: StoredV15ChainGasConstants;

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
  recentTransfers: StoredV15Clog[];
  trackedRequests: StoredV8TrackedRequest[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];
  recommendedExchanges: StoredV15RecommendedExchange[];
  suggestedActions: StoredV15SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: StoredV15ChainGasConstants;

  pushToken: string | null;

  linkedAccounts?: StoredV15LinkedAccount[];
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
  recentTransfers: StoredV15Clog[];
  trackedRequests: StoredV8TrackedRequest[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];
  recommendedExchanges: StoredV15RecommendedExchange[];
  suggestedActions: StoredV15SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: StoredV15ChainGasConstants;

  pushToken: string | null;
  linkedAccounts: StoredV15LinkedAccount[];
  inviteLinkStatus: StoredV15DaimoInviteCodeStatus | null;
  invitees: StoredV15EAccount[];

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
  recentTransfers: StoredV15Clog[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];
  recommendedExchanges: StoredV15RecommendedExchange[];
  suggestedActions: StoredV15SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: StoredV15ChainGasConstants;

  pushToken: string | null;
  linkedAccounts: StoredV15LinkedAccount[];
  inviteLinkStatus: StoredV15DaimoInviteCodeStatus | null;
  invitees: StoredV15EAccount[];

  isOnboarded?: boolean;

  notificationRequestStatuses: StoredV15DaimoRequestV2Status[];
  lastReadNotifTimestamp: number;
  proposedSwaps: StoredV15ProposedSwap[];
  exchangeRates?: StoredV15CurrencyExchangeRate[];
  sentPaymentLinks?: StoredV15DaimoLinkNoteV2[];
}

interface StoredV15Account extends StoredModel {
  storageVersion: 15;

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
  recentTransfers: StoredV15Clog[];
  namedAccounts: StoredV15EAccount[];
  accountKeys: StoredV15KeyData[];
  pendingKeyRotation: StoredV15KeyRotationClog[];
  recommendedExchanges: StoredV15RecommendedExchange[];
  suggestedActions: StoredV15SuggestedAction[];
  dismissedActionIDs: string[];

  chainGasConstants: StoredV15ChainGasConstants;

  pushToken: string | null;
  linkedAccounts: StoredV15LinkedAccount[];
  inviteLinkStatus: StoredV15DaimoInviteCodeStatus | null;
  invitees: StoredV15EAccount[];

  isOnboarded: boolean;

  notificationRequestStatuses: StoredV15DaimoRequestV2Status[];
  lastReadNotifTimestamp: number;
  proposedSwaps: StoredV15ProposedSwap[];
  exchangeRates: StoredV15CurrencyExchangeRate[];
  sentPaymentLinks: StoredV15DaimoLinkNoteV2[];

  landlineSessionURL?: string;
  landlineAccounts: StoredV15LandlineAccount[];
}

// Migrate old accounts to latest schema.
export function migrateOldAccount(model: StoredModel): Account {
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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

      landlineSessionURL: "",
      landlineAccounts: [],
    };
  } else if (model.storageVersion === 15) {
    console.log(`[ACCOUNT] MIGRATING v${model.storageVersion} account`);
    const a = model as StoredV15Account;
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

      recentTransfers: a.recentTransfers.map(migrateV15Clog),
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
      proposedSwaps: migrateV15ProposedSwaps(a.proposedSwaps),
      exchangeRates: a.exchangeRates || [],
      sentPaymentLinks: a.sentPaymentLinks || [],

      landlineSessionURL: a.landlineSessionURL || "",
      landlineAccounts: a.landlineAccounts || [],
    };
  } else {
    throw new Error(`Unhandled old storageVersion: ${model.storageVersion}`);
  }
}
