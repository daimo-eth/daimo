// SOON TO BE DEPRECATED FOR SHORTER LINKS /l/
import {
  DaimoAccountStatus,
  DaimoInviteCodeStatus,
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assert,
  daimoLinkBaseV2,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";
import { Metadata } from "next";
import Image from "next/image";

import { CallToAction } from "../../../components/CallToAction";
import { Providers } from "../../../components/Providers";
import { getI18N } from "../../../i18n";
import { getReqLang } from "../../../i18n/server";
import { getAbsoluteUrl } from "../../../utils/getAbsoluteUrl";
import { rpc } from "../../../utils/rpc";

//
// DEPRECATED
// This page exists solely for backcompat for old /link/ deeplinks.
// No need to translate to other languages.
//

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

type LinkProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

type TitleDesc = {
  name?: string;
  action?: string;
  dollars?: `${number}`;
  description: string;
  linkStatus?: DaimoLinkStatus;
};

// how to load i18n
const defaultMeta = metadata(
  "Daimo",
  "Payments on Ethereum",
  getAbsoluteUrl(`/logo-link-preview.png`)
);

function getUrl(props: LinkProps): string {
  const path = (props.params.slug || []).join("/");
  return `${daimoLinkBaseV2}/${path}`;
}

// Generates a OpenGraph link preview image URL
// The image itself is also generated dynamically -- see preview/route.tsx
function getPreviewURL(
  name: string | undefined,
  action: string | undefined,
  dollars: `${number}` | undefined
) {
  if (!name) return getAbsoluteUrl(`/logo-link-preview.png`);

  const uriEncodedAction = action ? encodeURIComponent(action) : undefined;
  let previewURL = getAbsoluteUrl(`/preview?name=${name}`);
  if (uriEncodedAction)
    previewURL = previewURL.concat(`&action=${uriEncodedAction}`);
  if (dollars) previewURL = previewURL.concat(`&dollars=${dollars}`);
  previewURL = previewURL.concat(`&v=3`); // cache bust images without profile pics
  return previewURL;
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const titleDesc = await loadTitleDesc(getUrl(props));
  if (titleDesc == null) return defaultMeta;
  const { name, action, dollars } = titleDesc;
  const prefixedDollars = dollars && `$${dollars}`;
  const title = [name, action, prefixedDollars].filter((x) => x).join(" ");
  const previewURL = getPreviewURL(name, action, dollars);
  return metadata(title, titleDesc.description, previewURL);
}

export default async function LinkPage(props: LinkProps) {
  return (
    <Providers>
      <LinkPageInner {...props} />
    </Providers>
  );
}

async function LinkPageInner(props: LinkProps) {
  const { name, action, dollars, description, linkStatus } =
    (await loadTitleDesc(getUrl(props))) || {
      title: "Daimo",
      description: "Payments on Ethereum",
    };

  return (
    <main className="max-w-md mx-auto px-4">
      <center>
        <div className="h-16" />
        <Image src="/logo-web.png" alt="Daimo" width="96" height="96" />

        <div className="h-12" />

        <div className="flex text-xl font-semibold justify-center items-center">
          {name && <span>{name}</span>}
          {action && <span className="text-grayMid">{" " + action}</span>}
        </div>
        {dollars && (
          <>
            <div className="h-4" />
            <div className="text-6xl font-semibold">${dollars}</div>
          </>
        )}
        <div className="h-9" />
        <CallToAction {...{ description, linkStatus }} />
      </center>
    </main>
  );
}

function metadata(
  title: string,
  description: string,
  previewURL: string
): Metadata {
  return {
    title,
    description,
    icons: {
      icon: "/logo-web-favicon.png",
    },
    openGraph: {
      title,
      description,
      siteName: title,
      images: [
        {
          url: previewURL,
          alt: "Daimo",
          width: 1200,
          height: 630,
        },
      ],
      type: "website",
    },
  };
}

async function loadTitleDesc(url: string): Promise<TitleDesc | null> {
  const i18n = getI18N(getReqLang());

  let res: DaimoLinkStatus;
  try {
    res = await rpc.getLinkStatus.query({ url });
  } catch (err) {
    console.warn(`Error loading link status for ${url}`, err);
    const link = parseDaimoLink(url);
    if (link == null) {
      return {
        name: "Daimo",
        description: i18n.link.errors.unrecognizedLink(),
      };
    } else if (link.type === "account") {
      return {
        name: `${link.account}`,
        description: i18n.link.errors.loadAccount(),
      };
    } else if (link.type === "request") {
      const result: TitleDesc = {
        name: `${link.recipient}`,
        action: i18n.link.actions.requestingPayment(),
        description: i18n.link.errors.loadStatus(),
      };
      if (link.dollars) {
        result.action = i18n.link.actions.requesting();
        result.dollars = `${link.dollars}`;
      }
      return result;
    } else if (link.type === "requestv2") {
      return {
        name: `${link.recipient}`,
        action: i18n.link.actions.requesting(),
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: i18n.link.errors.loadStatus(),
      };
    } else if (link.type === "notev2") {
      return {
        name: `${link.sender}`,
        action: i18n.link.actions.sentYou(),
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: i18n.link.errors.loadStatus(),
      };
    } else {
      assert(link.type === "note");
      return {
        name: `${link.previewSender}`,
        action: i18n.link.actions.sentYou(),
        dollars: `${Number(link.previewDollars).toFixed(2)}` as `${number}`,
        description: i18n.link.errors.loadStatus(),
      };
    }
  }

  switch (res.link.type) {
    case "account": {
      const { account } = res as DaimoAccountStatus;
      console.log(`[LINK] got account ${JSON.stringify(account)}`);
      return {
        name: getAccountName(account),
        description: i18n.link.responses.account.desc(),
      };
    }
    case "request": {
      const { recipient, fulfilledBy } = res as DaimoRequestStatus;
      const name = getAccountName(recipient);
      if (fulfilledBy === undefined) {
        const result: TitleDesc = {
          name: `${name}`,
          action: i18n.link.actions.requestingPayment(),
          description: i18n.link.responses.request.desc1(),
          linkStatus: res,
        };
        if (res.link.dollars) {
          result.action = i18n.link.actions.requesting();
          result.dollars = `${res.link.dollars}`;
        }
        return result;
      } else {
        const result: TitleDesc = {
          name: `${name}`,
          action: i18n.link.actions.requestedPayment(),
          description: i18n.link.responses.request.desc2(
            getAccountName(fulfilledBy)
          ),
        };
        if (res.link.dollars) {
          result.action = i18n.link.actions.requested();
          result.dollars = `${res.link.dollars}`;
        }
        return result;
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
            action: i18n.link.actions.requestingPayment(),
            dollars: `${res.link.dollars}`,
            description: i18n.link.responses.requestsv2.created(),
            linkStatus: res,
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
            action: i18n.link.actions.sentYou(),
            dollars: `${dollars}`,
            description: i18n.link.responses.notev2.confirmed(),
            linkStatus: res,
          };
        }
        case "claimed": {
          const claim = claimer
            ? getAccountName(claimer)
            : "(missing receiver)";
          return {
            name: `${getAccountName(sender)}`,
            action: i18n.link.actions.sent(),
            dollars: `${dollars}`,
            description: i18n.link.responses.notev2.claimed.desc(claim),
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
        linkStatus: res,
      };
    }
    default: {
      return null;
    }
  }
}
