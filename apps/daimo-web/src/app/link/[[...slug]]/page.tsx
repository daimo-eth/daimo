import { NamedAccount } from "@daimo/api";
import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  daimoLinkBase,
  parseDaimoLink,
} from "@daimo/client";
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
};

const domain = process.env.NEXT_PUBLIC_DOMAIN;

const defaultMeta = metadata("Daimo", "Experimental stablecoin wallet");

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const titleDesc = await loadTitleDesc(props);
  if (titleDesc == null) return defaultMeta;
  return metadata(titleDesc.title, titleDesc.description);
}

export default async function LinkPage(props: LinkProps) {
  const { title, description } = (await loadTitleDesc(props)) || {
    title: "Daimo",
    description: "Experimental stablecoin wallet",
  };

  return (
    <main className="max-w-sm mx-auto">
      <center>
        <div className="h-16" />
        <Image src="/logo-web.png" alt="Daimo" width="128" height="128" />

        <div className="h-12" />

        <H1>{title}</H1>
        <div className="h-2" />
        <H2>{description}</H2>
        <div className="h-12" />
        <H2>Coming soon to App Store</H2>
        <div className="h-4" />
        <div className="flex flex-row gap-4 justify-center">
          <AppStoreBadge platform="ios" />
          <AppStoreBadge platform="android" />
        </div>
        <div className="h-3" />
        <p>
          Till then, message <strong>dcposch</strong> on Telegram
          <br /> to try the TestFlight.
          <br />
        </p>
      </center>
    </main>
  );
}

async function loadTitleDesc({ params }: LinkProps): Promise<TitleDesc | null> {
  const path = (params.slug || []).join("/");
  const url = `${daimoLinkBase}/${path}`;

  let res: DaimoLinkStatus;
  try {
    res = await trpc.getLinkStatus.query({ url });
  } catch (err) {
    console.warn(`Error loading link status for ${url}`, err);
    return {
      title: "Daimo",
      description: "Unrecognized link",
    };
  }

  switch (res.link.type) {
    case "request": {
      const { recipient } = res as DaimoRequestStatus;
      return {
        title: `${recipient.name} is requesting $${res.link.amount}`,
        description: `Pay via Daimo or [to do: connect wallet]`,
      };
    }
    case "note": {
      const { amount, sender } = res as DaimoNoteStatus;
      return {
        title: `${sender.name} sent you $${amount}`,
        description: `Claim on Daimo or [to do: connect wallet]`,
      };
    }
    default: {
      return null;
    }
  }
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
