import {
  DaimoAccountStatus,
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  assert,
  daimoLinkBase,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";
import { Metadata } from "next";
import Image from "next/image";

import { PerformWalletAction } from "../../../components/PerformWalletAction";
import { trpc } from "../../../utils/trpc";

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

const domain = process.env.NEXT_PUBLIC_DOMAIN;

const defaultMeta = metadata("Daimo", "Payments on Ethereum");

function getUrl(props: LinkProps): string {
  const path = (props.params.slug || []).join("/");
  return `${daimoLinkBase}/${path}`;
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const titleDesc = await loadTitleDesc(getUrl(props));
  if (titleDesc == null) return defaultMeta;
  const { name, action, dollars } = titleDesc;
  const title = [name, action, dollars].filter((x) => x).join(" ");
  return metadata(title, titleDesc.description);
}

export default async function LinkPage(props: LinkProps) {
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
        {walletActionLinkStatus ? (
          <PerformWalletAction
            linkStatus={walletActionLinkStatus}
            description={description}
          />
        ) : (
          <h1 className="text-xl font-semibold text-grayMid">{description}</h1>
        )}
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
          url: `https://${domain}/logo-web.png`,
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
    res = await trpc.getLinkStatus.query({ url });
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
    } else if (link.type === "request") {
      return {
        name: `${link.recipient}`,
        action: `is requesting`,
        dollars: `${Number(link.dollars).toFixed(2)}` as `${number}`,
        description: "Couldn't load request status",
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
          description: "PAY",
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
    case "note": {
      const { status, dollars, sender, claimer } = res as DaimoNoteStatus;
      switch (status) {
        case "pending":
        case "confirmed": {
          return {
            name: `${getAccountName(sender)}`,
            action: `sent you`,
            dollars: `${dollars}`,
            description: `CLAIM`,
            walletActionLinkStatus: res,
          };
        }
        case "claimed": {
          const claim = claimer ? getAccountName(claimer) : "(missing claimer)";
          return {
            name: `${getAccountName(sender)}`,
            action: `sent`,
            dollars: `${dollars}`,
            description: `Claimed by ${claim}`,
          };
        }
        case "cancelled": {
          return {
            name: `${getAccountName(sender)}`,
            action: `cancelled send`,
            dollars: `${dollars}`,
            description: `Reclaimed by ${getAccountName(sender)}`,
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
