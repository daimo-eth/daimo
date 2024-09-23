import {
  ChainGasConstants,
  CurrencyExchangeRate,
  DaimoInviteCodeStatus,
  DaimoLinkNoteV2,
  DaimoRequestV2Status,
  EAccount,
  KeyData,
  KeyRotationClog,
  LandlineAccount,
  LinkedAccount,
  ProposedSwap,
  RecommendedExchange,
  SuggestedAction,
  TransferClog,
  assert,
  now,
} from "@daimo/common";
import {
  DaimoChain,
  ForeignToken,
  daimoPaymasterV2Address,
  getTokenByAddress,
} from "@daimo/contract";
import { Address, Hex, getAddress } from "viem";

import { StoredV16Account } from "./storedAccount";
import { migrateOldAccount } from "./storedAccountMigrations";
import { StoredModel } from "./storedModel";
import { env, getEnvMobile } from "../env";

const appVariant = getEnvMobile().DAIMO_APP_VARIANT;

/**
 * Singleton account key.
 * Will be a series if/when we support multiple accounts.
 */
export const defaultEnclaveKeyName =
  appVariant === "dev" ? "daimo-dev-12" : "daimo-12";

/**
 * Device API key name: serves as poor man's device attestation.
 * Fixed key created once and never deleted -- used as an alternate to
 * device attestations.
 */
export const deviceAPIKeyName =
  appVariant === "dev" ? "daimo-apikey-dev" : "daimo-apikey";

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
  recentTransfers: TransferClog[];
  /** Names for each Daimo account we've interacted with. */
  namedAccounts: EAccount[];
  /** P-256 keys authorised by the Daimo account, in DER format */
  accountKeys: KeyData[];
  /** Pending changes to authorised keys  */
  pendingKeyRotation: KeyRotationClog[];

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

  /** Session URL used to authenticate to the Landline onramp/offramp app **/
  landlineSessionURL: string;
  /** Bank accounts connected to the Landline onramp/offramp app **/
  landlineAccounts: LandlineAccount[];
};

/** Extracts a named EAccount = this account as it appears in search. */
export function toEAccount(account: Account): EAccount {
  return {
    addr: account.address,
    name: account.name,
    profilePicture: account.profilePicture,
  };
}

/** Gets the home coin + home chain for this account. */
export function getHomeCoin(account: Account): ForeignToken {
  const { homeChainId, homeCoinAddress } = account;
  const homeCoin = getTokenByAddress(homeChainId, homeCoinAddress);
  return homeCoin;
}

export function parseAccount(accountJSON?: string): Account | null {
  if (!accountJSON) return null;
  const model = JSON.parse(accountJSON) as StoredModel;

  // Migrations
  // Delete V1-7 testnet accounts. Re-onboard to latest account with paymasters.
  if (model.storageVersion < 8) {
    console.log(`[ACCOUNT] DROPPING v${model.storageVersion} account`);
    return null;
  }

  // Migrate old accounts to latest schema.
  const latestVersion = 16;
  if (model.storageVersion < latestVersion) {
    return migrateOldAccount(model);
  }

  assert(
    model.storageVersion === latestVersion,
    `Unknown account storage version ${model.storageVersion}`
  );
  const a = model as StoredV16Account;

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

    linkedAccounts: a.linkedAccounts,
    inviteLinkStatus: a.inviteLinkStatus,
    invitees: a.invitees,

    isOnboarded: a.isOnboarded,

    notificationRequestStatuses: a.notificationRequestStatuses,
    lastReadNotifTimestamp: a.lastReadNotifTimestamp,
    proposedSwaps: a.proposedSwaps,
    exchangeRates: a.exchangeRates,
    sentPaymentLinks: a.sentPaymentLinks,

    landlineSessionURL: a.landlineSessionURL ?? "",
    landlineAccounts: a.landlineAccounts,
  };
}

export function serializeAccount(account: Account | null): string {
  if (!account) return "";

  const model: StoredV16Account = {
    storageVersion: 16,

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

    landlineSessionURL: account.landlineSessionURL,
    landlineAccounts: account.landlineAccounts,
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

    landlineSessionURL: "",
    landlineAccounts: [],
  };
}
