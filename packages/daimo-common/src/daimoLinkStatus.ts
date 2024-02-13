import { Address, Hex } from "viem";

import {
  DaimoLinkAccount,
  DaimoLinkInvite,
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
  | DaimoInviteStatus;

/**
 * Summarizes a link to any Ethereum account.
 */
export type DaimoAccountStatus = {
  link: DaimoLinkAccount;
  account: EAccount;
};

/**
 * Tracks details about a request for payment.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoRequestStatus = {
  link: DaimoLinkRequest;

  recipient: EAccount;
  requestId: `${bigint}`;
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
}

/**
 * Tracks details about a request for payment.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoRequestV2Status = {
  link: DaimoLinkRequestV2;

  recipient: EAccount;
  creator?: EAccount;
  status: DaimoRequestState;
  metadata: Hex;
  fulfilledBy?: EAccount;
  isValidInvite?: boolean;
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
  status: DaimoNoteState;
  sender: EAccount;
  id?: string;
  /* Ephemeral notes contract address, used to distinguish between likes from
   * contract DaimoEphemeralNotes vs. DaimoEphemeralNotesV2
   */
  contractAddress: Address;
  ephemeralOwner?: Address;
  claimer?: EAccount;
  dollars: `${number}`;
};

/**
 * Tracks details about an invite.
 * This information is tracked offchain by the API server.
 */
export type DaimoInviteStatus = {
  link: DaimoLinkInvite;
  isValid: boolean;
  sender?: EAccount;
};
