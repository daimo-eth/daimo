import { Address, Hex } from "viem";

import { assert, assertNotNull } from "./assert";
import {
  DaimoLinkAccount,
  DaimoLinkInviteCode,
  DaimoLinkNote,
  DaimoLinkNoteV2,
  DaimoLinkRequest,
  DaimoLinkRequestV2,
} from "./daimoLink";
import { EAccount } from "./eAccount";

export type DaimoLinkStatus =
  | DaimoAccountStatus
  | DaimoRequestStatus
  | DaimoRequestV2Status
  | DaimoNoteStatus
  | DaimoInviteCodeStatus;

// Asserts that status is a DaimoAccountStatus, returns DaimoAccountStatus
export function assertDaimoAccountStatus(
  status?: DaimoLinkStatus
): DaimoAccountStatus {
  assert(assertNotNull(status).link.type !== "account");
  return status as DaimoAccountStatus;
}

export function assertDaimoRequestV2Status(
  status?: DaimoLinkStatus
): DaimoRequestV2Status {
  assert(assertNotNull(status).link.type === "requestv2");
  return status as DaimoRequestV2Status;
}

/**
 * Summarizes a link to any Ethereum account.
 */
export type DaimoAccountStatus = {
  link: DaimoLinkAccount;
  account: EAccount;
  inviter?: EAccount;
};

/**
 * Tracks details about a request for payment.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoRequestStatus = {
  link: DaimoLinkRequest;

  recipient: EAccount;
  requestId?: `${bigint}`;
  fulfilledBy?: EAccount;
  isValidInvite?: boolean;
};

/**
 * Pending means the request hasn't yet been created onchain.
 * Created means it's been created and is waiting to be fulfilled.
 * Cancelled means cancelled by the original sender, and fulfilled means
 * fulfilled by anyone.
 */
export enum DaimoRequestState {
  Pending = "pending",
  Created = "created",
  Fulfilled = "fulfilled",
  Cancelled = "cancelled",
  Declined = "declined", // Offchain
}

/**
 * Tracks details about a request for payment.
 * All of this information (except declines) can be looked up onchain given `link`.
 */
export type DaimoRequestV2Status = {
  link: DaimoLinkRequestV2;

  recipient: EAccount;
  creator?: EAccount;
  status: DaimoRequestState;
  metadata: Hex;
  createdAt: number;
  fulfilledBy?: EAccount;
  isValidInvite?: boolean;
  expectedFulfiller?: EAccount; // Request from a specific Daimo address
  updatedAt?: number;
  memo?: string;
};

/**
 * Pending means the note hasn't yet been created onchain. Confirmed means
 * it's been created and is waiting to be claimed. Cancelled means claimed
 * back by the original sender, and claimed means claimed by anyone else.
 */
export enum DaimoNoteState {
  Pending = "pending",
  Confirmed = "confirmed",
  Claimed = "claimed",
  Cancelled = "cancelled",
}

/**
 * Tracks details about a Note.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoNoteStatus = {
  link: DaimoLinkNote | DaimoLinkNoteV2;
  // Status. Pending = not yet onchain, Confirmed = onchain & claimable.
  status: DaimoNoteState;
  // Note creator (Daimo account)
  sender: EAccount;
  // NoteV2 ID, derived from the ephemeralOwner. (sender, ID) is likely unique.
  id?: string;
  // DaimoEphemeralNotes vs. DaimoEphemeralNotesV2 contract address
  contractAddress: Address;
  // Ephemeral note owner (burner EOA, just for this note)
  ephemeralOwner?: Address;
  // Claimer, or undefined if the note is not yet claimed or cancelled.
  claimer?: EAccount;
  // Dollar value = exact amount of stablecoin sent via this note.
  dollars: `${number}`;
  // Optional memo.
  memo?: string;
};

/**
 * Tracks details about an invite.
 * This information is tracked offchain by the API server.
 */
export type DaimoInviteCodeStatus = {
  link: DaimoLinkInviteCode;
  createdAt: number;
  isValid: boolean;
  usesLeft?: number;
  bonusDollarsInvitee?: number;
  bonusDollarsInviter?: number;
  inviter?: EAccount;
};
