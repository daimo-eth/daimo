import { Address } from "viem";

import {
  DaimoLinkAccount,
  DaimoLinkNote,
  DaimoLinkNoteV2,
  DaimoLinkRequest,
} from "./daimoLink";
import { EAccount } from "./eAccount";

export type DaimoLinkStatus =
  | DaimoAccountStatus
  | DaimoRequestStatus
  | DaimoNoteStatus;

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
