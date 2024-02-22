import { DaimoLink, parseDaimoLink } from "./daimoLink";
import {
  DaimoInviteStatus,
  DaimoLinkStatus,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestStatus,
  DaimoRequestV2Status,
} from "./daimoLinkStatus";
import { EAccount } from "./eAccount";

/* Interpret text as a potential invite link */
export function getInvitePasteLink(text: string): DaimoLink {
  // Check if its a valid Daimo link
  const link = parseDaimoLink(text);
  if (link) return link;
  return { type: "invite", code: text };
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
    const inviteStatus = linkStatus as DaimoInviteStatus;

    return {
      isValid: inviteStatus.isValid,
      sender: inviteStatus.sender,
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
