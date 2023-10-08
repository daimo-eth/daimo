import { DaimoLinkAccount, DaimoLinkNote, DaimoLinkRequest } from "./daimoLink";
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
 * Tracks details about a Note.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoNoteStatus = {
  link: DaimoLinkNote;

  /**
   * Pending means the note hasn't yet been created onchain. Confirmed means
   * it's been created and is waiting to be claimed. Cancelled means claimed
   * back by the original sender, and claimed means claimed by anyone else.
   */
  status: "pending" | "confirmed" | "claimed" | "cancelled";
  sender: EAccount;
  claimer?: EAccount;
  dollars: `${number}`;
};
