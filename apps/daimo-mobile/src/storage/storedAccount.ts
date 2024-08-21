import { Address, Hex } from "viem";

import { StoredModel } from "./storedModel";
import {
  StoredV15ChainGasConstants,
  StoredV15CurrencyExchangeRate,
  StoredV15DaimoInviteCodeStatus,
  StoredV15DaimoLinkNoteV2,
  StoredV15DaimoRequestV2Status,
  StoredV15EAccount,
  StoredV15KeyData,
  StoredV15KeyRotationClog,
  StoredV15LandlineAccount,
  StoredV15LinkedAccount,
  StoredV15RecommendedExchange,
  StoredV15SuggestedAction,
  StoredV16Clog,
  StoredV16ProposedSwap,
} from "./storedTypes";

//
// This file describes the current schema for locally-stored user accounts.
// IMPORTANT: do not edit these except to add new OPTIONAL fields or enums.
// All other changes require a version bump + migration.
// Stored accounts can only contain StoredV[...] types.
//

export interface StoredV16Account extends StoredModel {
  storageVersion: 16;

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
  recentTransfers: StoredV16Clog[];
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
  proposedSwaps: StoredV16ProposedSwap[];
  exchangeRates: StoredV15CurrencyExchangeRate[];
  sentPaymentLinks: StoredV15DaimoLinkNoteV2[];

  landlineSessionURL?: string;
  landlineAccounts: StoredV15LandlineAccount[];
}
