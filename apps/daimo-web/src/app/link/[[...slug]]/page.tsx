// SOON TO BE DEPRECATED FOR SHORTER LINKS /l/
import {
  DaimoAccountStatus,
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assert,
  daimoDomain,
  daimoLinkBaseV2,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";
import { Metadata } from "next";
import Image from "next/image";

import { CallToAction } from "../../../components/CallToAction";
import { Providers, chainsDaimoL2 } from "../../../components/Providers";
import { rpc } from "../../../utils/rpc";

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
  walletActionLinkStatus?: DaimoLinkStatus;
};

const defaultMeta = metadata("Daimo", "Payments on Ethereum");

function getUrl(props: LinkProps): string {
  const path = (props.params.slug || []).join("/");
  return `${daimoLinkBaseV2}/${path}`;
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const titleDesc = await loadTitleDesc(getUrl(props));
  if (titleDesc == null) return defaultMeta;
  const { name, action, dollars } = titleDesc;
  const prefixedDollars = dollars && `$${dollars}`;
  const title = [name, action, prefixedDollars].filter((x) => x).join(" ");
  return metadata(title, titleDesc.description);
}

export default async function LinkPage(props: LinkProps) {
  return (
    <Providers chains={chainsDaimoL2}>
      <LinkPageInner {...props} />
    </Providers>
  );
}

async function LinkPageInner(props: LinkProps) {
  const { name, action, dollars, description, walletActionLinkStatus } =
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

        <div className="text-xl font-semibold">
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
        <CallToAction {...{ description, walletActionLinkStatus }} />
      </center>
    </main>
  );
}

function metadata(title: string, description: string): Metadata {
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
          url: `https://${daimoDomain}/logo-link-preview.png`,
          alt: "Daimo",
        },
      ],
      type: "website",
    },
  };
}

async function loadTitleDesc(url: string): Promise<TitleDesc | null> {
  let res: DaimoLinkStatus;
  try {
    res = await rpc.getLinkStatus.query({ url });
  } catch (err) {
    console.warn(`Error loading link status for ${url}`, err);
    const link = parseDaimoLink(url);
    if (link == null) {
      return {
        name: "Daimo",
        description: "Unrecognized link",
      };
    } else if (link.type === "account") {
      return {
        name: `${link.account}`,
        description: "Couldn't load account",
      };
    } else if (link.type === "request" || link.type === "requestv2") {
      return {
        name: `${link.recipient}`,
        action: `is requesting`,
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load request status",
      };
    } else if (link.type === "notev2") {
      return {
        name: `${link.sender}`,
        action: `sent you`,
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load payment link",
      };
    } else {
      assert(link.type === "note");
      return {
        name: `${link.previewSender}`,
        action: `sent you`,
        dollars: `${Number(link.previewDollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load payment link",
      };
    }
  }

  switch (res.link.type) {
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
          walletActionLinkStatus: res,
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
            walletActionLinkStatus: res,
          };
        }
        case DaimoRequestState.Cancelled: {
          return {
            name: `${name}`,
            action: `cancelled request`,
            dollars: `${res.link.dollars}`,
            description: `Cancelled by ${getAccountName(recipient)}`,
          };
        }
        case DaimoRequestState.Fulfilled: {
          return {
            name: `${name}`,
            action: `requested`,
            dollars: `${res.link.dollars}`,
            description: `Paid by ${getAccountName(fulfilledBy!)}`,
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
            walletActionLinkStatus: res,
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
    default: {
      return null;
    }
  }
}
