import { DaimoLinkNote, DaimoLinkRequest } from "./daimoLink";
import { NamedAccount } from "./model";

export type DaimoLinkStatus = DaimoRequestStatus | DaimoNoteStatus;

/**
 * Tracks details about a request for payment.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoRequestStatus = {
  link: DaimoLinkRequest;

  recipient: NamedAccount;
  // TODO: track whether the request is paid
  // https://github.com/daimo-eth/daimo/issues/97
};

/**
 * Tracks details about a Note.
 * All of this information can be looked up onchain given `link`.
 */
export type DaimoNoteStatus = {
  link: DaimoLinkNote;

  status: "pending" | "claimed" | "cancelled";
  sender: NamedAccount;
  claimer?: NamedAccount;
  dollars: `${number}`;
};
