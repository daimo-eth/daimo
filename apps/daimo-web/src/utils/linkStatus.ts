import {
  DaimoAccountStatus,
  DaimoInviteCodeStatus,
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";

import { rpc } from "./rpc";

// Daimo deep link status (pending, fulfilled, cancelled, etc)
// with a human-readable description.
export interface LinkStatusDesc {
  description: string;
  linkStatus?: DaimoLinkStatus;
  name?: string;
  action?: string;
  dollars?: `${number}`;
  memo?: string;
}

export async function loadLinkStatusDesc(
  url: string,
): Promise<LinkStatusDesc | null> {
  let linkStatus: DaimoLinkStatus;
  try {
    linkStatus = await rpc.getLinkStatus.query({ url });
  } catch (err) {
    console.warn(`Error loading link status for ${url}`, err);
    return getLinkDescCantLoadStatus(url);
  }

  console.log(`[LINK] got status for ${url}: ${JSON.stringify(linkStatus)}`);
  const ret = getLinkDescFromStatus(linkStatus);
  return { ...ret, linkStatus };
}

function getLinkDescCantLoadStatus(url: string): LinkStatusDesc {
  const link = parseDaimoLink(url);
  if (link == null) {
    return {
      name: "Daimo",
      description: "Unrecognized link",
    };
  }

  switch (link.type) {
    case "account":
      return {
        name: `${link.account}`,
        description: "Couldn't load account",
      };
    case "request":
    case "requestv2":
      return {
        name: `${link.recipient}`,
        action: `is requesting`,
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load request status",
        memo: link.type === "requestv2" ? link.memo : undefined,
      };
    case "notev2":
      return {
        name: `${link.sender}`,
        action: `sent you`,
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load payment link",
      };
    case "note":
      return {
        name: `${link.previewSender}`,
        action: `sent you`,
        dollars: `${Number(link.previewDollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load payment link",
      };
    default:
      return {
        name: "Daimo",
        description: "Unhandled link type: " + link.type,
      };
  }
}

function getLinkDescFromStatus(res: DaimoLinkStatus): LinkStatusDesc {
  // Handle link status
  const resLinkType = res.link.type;
  switch (resLinkType) {
    case "account": {
      const { account } = res as DaimoAccountStatus;
      return {
        name: getAccountName(account),
        description: "Get Daimo to send or receive payments",
      };
    }
    case "request": {
      const { recipient, fulfilledBy } = res as DaimoRequestStatus;
      const name = getAccountName(recipient);
      if (fulfilledBy === undefined) {
        return {
          name: `${name}`,
          action: `is requesting`,
          dollars: `${res.link.dollars}`,
          description: "Pay with Daimo",
        };
      } else {
        return {
          name: `${name}`,
          action: `requested`,
          dollars: `${res.link.dollars}`,
          description: `Paid by ${getAccountName(fulfilledBy)}`,
        };
      }
    }
    case "requestv2": {
      const { recipient, fulfilledBy, status } = res as DaimoRequestV2Status;
      const name = getAccountName(recipient);

      switch (status) {
        case DaimoRequestState.Pending:
        case DaimoRequestState.Created: {
          return {
            name: `${name}`,
            action: `is requesting`,
            dollars: `${res.link.dollars}`,
            description: "Pay with Daimo",
            memo: res.link.memo,
          };
        }
        case DaimoRequestState.Cancelled: {
          return {
            name: `${name}`,
            action: `cancelled request`,
            dollars: `${res.link.dollars}`,
            description: `Cancelled by ${getAccountName(recipient)}`,
            memo: res.link.memo,
          };
        }
        case DaimoRequestState.Fulfilled: {
          return {
            name: `${name}`,
            action: `requested`,
            dollars: `${res.link.dollars}`,
            description: `Paid by ${getAccountName(fulfilledBy!)}`,
            memo: res.link.memo,
          };
        }
        default: {
          throw new Error(`unexpected DaimoRequestState ${status}`);
        }
      }
    }
    case "note":
    case "notev2": {
      const { status, dollars, sender, claimer } = res as DaimoNoteStatus;
      switch (status) {
        case "pending":
        case "confirmed": {
          return {
            name: `${getAccountName(sender)}`,
            action: `sent you`,
            dollars: `${dollars}`,
            description: "Accept with Daimo",
          };
        }
        case "claimed": {
          const claim = claimer
            ? getAccountName(claimer)
            : "(missing receiver)";
          return {
            name: `${getAccountName(sender)}`,
            action: `sent`,
            dollars: `${dollars}`,
            description: `Accepted by ${claim}`,
          };
        }
        case "cancelled": {
          return {
            name: `${getAccountName(sender)}`,
            action: `cancelled send`,
            dollars: `${dollars}`,
            description: `Cancelled by ${getAccountName(sender)}`,
          };
        }
        default: {
          throw new Error(`unexpected DaimoNoteStatus ${status}`);
        }
      }
    }
    case "invite": {
      const { inviter, bonusDollarsInvitee, bonusDollarsInviter, isValid } =
        res as DaimoInviteCodeStatus;

      const description = (() => {
        if (!isValid) return "Invite expired";
        if (
          bonusDollarsInvitee &&
          bonusDollarsInviter &&
          bonusDollarsInvitee === bonusDollarsInviter
        ) {
          return `Accept their invite and we'll send you both $${bonusDollarsInvitee} USDC`;
        } else if (bonusDollarsInvitee) {
          return `Accept their invite and we'll send you $${bonusDollarsInvitee} USDC`;
        } else return "Get Daimo to send or receive payments";
      })();
      return {
        name: `${inviter ? getAccountName(inviter) : "daimo"}`,
        action: `invited you to Daimo`,
        description,
      };
    }
    default: {
      return {
        name: "Daimo",
        description: "Unhandled link status for type: " + resLinkType,
      };
    }
  }
}
