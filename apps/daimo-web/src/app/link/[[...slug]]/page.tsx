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

import { AppStoreBadge } from "../../../components/AppStoreBadge";
import { H1, H2 } from "../../../components/typography";
import { trpc } from "../../../utils/trpc";

type LinkProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

type TitleDesc = {
  title: string;
  description: string;
  walletAction?: boolean;
};

const domain = process.env.NEXT_PUBLIC_DOMAIN;

const defaultMeta = metadata("Daimo", "Experimental stablecoin wallet");

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const titleDesc = await loadTitleDesc(props);
  if (titleDesc == null) return defaultMeta;
  return metadata(titleDesc.title, titleDesc.description);
}

export default async function LinkPage(props: LinkProps) {
  const { title, description, walletAction } = (await loadTitleDesc(props)) || {
    title: "Daimo",
    description: "Experimental stablecoin wallet",
  };

  return (
    <main className="max-w-md mx-auto px-4">
      <center>
        <div className="h-16" />
        <Image src="/logo-web.png" alt="Daimo" width="128" height="128" />

        <div className="h-12" />

        <H1>{title}</H1>
        <div className="h-4" />
        <H2>{description}</H2>
        {walletAction && <OrConnectWalletStub />}
        <div className="h-12" />
        <AppStoreBadge />
      </center>
    </main>
  );
}

function OrConnectWalletStub() {
  return (
    // eslint-disable-next-line no-script-url
    <a className="text-primary" href="javascript:alert('Coming soon')">
      or with any Ethereum wallet
    </a>
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

async function loadTitleDesc({ params }: LinkProps): Promise<TitleDesc | null> {
  const path = (params.slug || []).join("/");
  const url = `${daimoLinkBase}/${path}`;

  let res: DaimoLinkStatus;
  try {
    res = await trpc.getLinkStatus.query({ url });
  } catch (err) {
    console.warn(`Error loading link status for ${url}`, err);
    const link = parseDaimoLink(url);
    if (link == null) {
      return {
        title: "Daimo",
        description: "Unrecognized link",
      };
    } else if (link.type === "account") {
      return {
        title: `${link.account}`,
        description: "Couldn't load account name",
      };
    } else if (link.type === "request") {
      return {
        title: `Request for $${link.dollars}`,
        description: "Couldn't load request status",
      };
    } else {
      assert(link.type === "note");
      return {
        title: `Payment ${getAccountName({ addr: link.ephemeralOwner })}`,
        description: "Couldn't load Payment Link status",
      };
    }
  }

  switch (res.link.type) {
    case "account": {
      const { account } = res as DaimoAccountStatus;
      return {
        title: `${getAccountName(account)} is on Daimo`,
        description: "Send or recieve payments from them",
      };
    }
    case "request": {
      const { recipient, fulfilledBy } = res as DaimoRequestStatus;
      const name = getAccountName(recipient);
      if (fulfilledBy === undefined) {
        return {
          title: `${name} is requesting $${res.link.dollars}`,
          description: "Pay via Daimo",
          walletAction: true,
        };
      } else {
        return {
          title: `${name} requested $${res.link.dollars} from ${getAccountName(
            fulfilledBy
          )}`,
          description: `Paid by ${getAccountName(fulfilledBy)}`,
        };
      }
    }
    case "note": {
      const { status, dollars, sender, claimer } = res as DaimoNoteStatus;
      switch (status) {
        case "pending": {
          return {
            title: `${getAccountName(sender)} sent you $${dollars}`,
            description: `Claim on Daimo`,
            walletAction: true,
          };
        }
        case "claimed": {
          const claim = claimer ? getAccountName(claimer) : "(missing claimer)";
          return {
            title: `${getAccountName(sender)} sent $${dollars}`,
            description: `Claimed by ${claim}`,
          };
        }
        case "cancelled": {
          return {
            title: `Cancelled send: $${dollars}`,
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
