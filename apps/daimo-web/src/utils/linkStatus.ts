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
import { getI18N } from "../i18n";
import { getReqLang } from "../i18n/server";

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
  url: string
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
  const i18n = getI18N(getReqLang());

  const link = parseDaimoLink(url);
  if (link == null) {
    return {
      name: "Daimo",
      description: i18n.link.errors.unrecognizedLink(),
    };
  }

  switch (link.type) {
    case "account":
      return {
        name: `${link.account}`,
        description: i18n.link.errors.loadAccount(),
      };
    case "request": {
      const result: LinkStatusDesc = {
        name: `${link.recipient}`,
        action: i18n.link.actions.requestingPayment(),
        description: i18n.link.errors.loadStatus(),
      };
      if (link.dollars) {
        result.action = i18n.link.actions.requesting();
        result.dollars = `${Number(link.dollars).toFixed(2)}` as `${number}`;
      }
      return result;
    }
    case "requestv2":
      return {
        name: `${link.recipient}`,
        action: i18n.link.actions.requesting(),
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: i18n.link.errors.loadStatus(),
        memo: link.type === "requestv2" ? link.memo : undefined,
      };
    case "notev2":
      return {
        name: `${link.sender}`,
        action: i18n.link.actions.sentYou(),
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: i18n.link.errors.loadPayLink(),
      };
    case "note":
      return {
        name: `${link.previewSender}`,
        action: i18n.link.actions.sentYou(),
        dollars: `${Number(link.previewDollars).toFixed(2)}` as `${number}`,
        description: i18n.link.errors.loadPayLink(),
      };
    default:
      return {
        name: "Daimo",
        description: i18n.utils.linkStatus.unhandeledLink(link.type),
      };
  }
}

function getLinkDescFromStatus(res: DaimoLinkStatus): LinkStatusDesc {
  const i18n = getI18N(getReqLang());

  // Handle link status
  const resLinkType = res.link.type;
  switch (resLinkType) {
    case "account": {
      const { account } = res as DaimoAccountStatus;
      return {
        name: getAccountName(account),
        description: i18n.link.responses.account.desc(),
      };
    }
    case "request": {
      const { recipient, fulfilledBy } = res as DaimoRequestStatus;
      const name = getAccountName(recipient);
      if (fulfilledBy === undefined) {
        const result: LinkStatusDesc = {
          name: `${name}`,
          action: i18n.link.actions.requestingPayment(),
          description: i18n.link.responses.request.desc1(),
        };
        if (res.link.dollars) {
          result.action = i18n.link.actions.requesting();
          result.dollars = `${res.link.dollars}`;
        }
        return result;
      } else {
        const result: LinkStatusDesc = {
          name: `${name}`,
          action: i18n.link.actions.requested(),
          description: i18n.link.responses.request.desc2(
            getAccountName(fulfilledBy)
          ),
        };
        if (res.link.dollars) {
          result.action = `requested`;
          result.dollars = `${res.link.dollars}`;
        }
        return result;
      }
    }
    case "requestv2": {
      const { recipient, fulfilledBy, status, memo } =
        res as DaimoRequestV2Status;
      const name = getAccountName(recipient);

      switch (status) {
        case DaimoRequestState.Pending:
        case DaimoRequestState.Created: {
          return {
            name: `${name}`,
            action: i18n.link.actions.requesting(),
            dollars: `${res.link.dollars}`,
            description: i18n.link.responses.requestsv2.created(),
            memo,
          };
        }
        case DaimoRequestState.Cancelled: {
          return {
            name: `${name}`,
            action: i18n.link.actions.cancelledRequest(),
            dollars: `${res.link.dollars}`,
            description: i18n.link.responses.requestsv2.canceled(
              getAccountName(recipient)
            ),
            memo,
          };
        }
        case DaimoRequestState.Fulfilled: {
          return {
            name: `${name}`,
            action: i18n.link.actions.requested(),
            dollars: `${res.link.dollars}`,
            description: i18n.link.responses.requestsv2.fulfilled(
              getAccountName(fulfilledBy!)
            ),
            memo,
          };
        }
        default: {
          throw new Error(i18n.link.responses.requestsv2.default(status));
        }
      }
    }
    case "note":
    case "notev2": {
      const { status, dollars, sender, claimer, memo } = res as DaimoNoteStatus;
      switch (status) {
        case "pending":
        case "confirmed": {
          return {
            name: `${getAccountName(sender)}`,
            action: i18n.link.actions.sentYou(),
            dollars: `${dollars}`,
            description: i18n.link.responses.notev2.confirmed(),
            memo,
          };
        }
        case "claimed": {
          const claim = claimer
            ? getAccountName(claimer)
            : i18n.link.responses.notev2.claimed.missingReceiver();
          return {
            name: `${getAccountName(sender)}`,
            action: i18n.link.actions.sent(),
            dollars: `${dollars}`,
            description: i18n.link.responses.notev2.claimed.desc(claim),
            memo,
          };
        }
        case "cancelled": {
          return {
            name: `${getAccountName(sender)}`,
            action: i18n.link.actions.cancelledSend(),
            dollars: `${dollars}`,
            description: i18n.link.responses.notev2.cancelled(
              getAccountName(sender)
            ),
            memo,
          };
        }
        default: {
          throw new Error(i18n.link.responses.notev2.default(status));
        }
      }
    }
    case "invite": {
      const { inviter, bonusDollarsInvitee, bonusDollarsInviter, isValid } =
        res as DaimoInviteCodeStatus;

      const description = (() => {
        if (!isValid) return i18n.link.responses.invite.expired();
        if (
          bonusDollarsInvitee &&
          bonusDollarsInviter &&
          bonusDollarsInvitee === bonusDollarsInviter
        ) {
          return i18n.link.responses.invite.acceptTheInviteBoth(
            bonusDollarsInvitee
          );
        } else if (bonusDollarsInvitee) {
          return i18n.link.responses.invite.acceptTheInvite(
            bonusDollarsInvitee
          );
        } else return i18n.link.responses.invite.getDaimo();
      })();
      return {
        name: `${inviter ? getAccountName(inviter) : "daimo"}`,
        action: i18n.link.actions.invitedYou(),
        description,
      };
    }
    default: {
      return {
        name: "Daimo",
        description: i18n.utils.linkStatus.unhandeledLinkForType(
          i18n.utils.linkStatus.unhandeledLinkForType(resLinkType)
        ),
      };
    }
  }
}
