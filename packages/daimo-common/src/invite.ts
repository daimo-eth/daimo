import { DaimoLink, parseDaimoLink } from "./daimoLink";
import {
  DaimoInviteCodeStatus,
  DaimoLinkStatus,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestStatus,
  DaimoRequestV2Status,
} from "./daimoLinkStatus";
import { EAccount } from "./eAccount";

// Checks if something *looks* like an invite link. Does not check with the API.
// Returns a normalized DaimoLink, or undefined if the input doesn't look valid.
export function parseInviteCodeOrLink(str: string): DaimoLink | undefined {
  if (str.length < 3) return undefined;

  // Does it look like a code
  const lower = str.toLowerCase();
  const looksValid = /^[a-z][a-z0-9-]{2,24}$/.test(lower);
  if (looksValid) return { type: "invite", code: lower };

  // Is it a link?
  const link = parseDaimoLink(str);
  return link || undefined;
}

export interface LinkInviteStatus {
  isValid: boolean;
  sender?: EAccount;
}

export function getInviteStatus(linkStatus: DaimoLinkStatus): LinkInviteStatus {
  if (linkStatus.link.type === "notev2") {
    const noteStatus = linkStatus as DaimoNoteStatus;
    return {
      isValid:
        noteStatus.status === DaimoNoteState.Confirmed &&
        linkStatus.link?.type === "notev2",
      sender: noteStatus.sender,
    };
  } else if (linkStatus.link.type === "invite") {
    const inviteStatus = linkStatus as DaimoInviteCodeStatus;

    return {
      isValid: inviteStatus.isValid,
      sender: inviteStatus.inviter,
    };
  } else if (
    linkStatus.link.type === "request" ||
    linkStatus.link.type === "requestv2"
  ) {
    const reqStatus = linkStatus as DaimoRequestStatus | DaimoRequestV2Status;

    const isValid =
      (reqStatus.isValidInvite ?? false) && reqStatus.fulfilledBy === undefined;

    return {
      isValid,
      sender: reqStatus.recipient,
    };
  } else {
    return {
      isValid: false,
      sender: undefined,
    };
  }
}
