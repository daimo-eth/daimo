import { NamedAccount } from "@daimo/api";
import { daimoLinkBase, parseDaimoLink } from "@daimo/client";
import { Metadata } from "next";
import Image from "next/image";

import { AppStoreBadge } from "../../../components/AppStoreBadge";
import { H1, H2 } from "../../../components/typography";

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
        <Image src="/logo-web.png" alt="Daimo" width="180" height="180" />

        <div className="h-12" />

        <H1>{title}</H1>
        <div className="h-2" />
        <H2>{description}</H2>
        <div className="h-8" />
        <div className="flex flex-row gap-4 justify-center">
          <AppStoreBadge platform="ios" />
          <AppStoreBadge platform="android" />
        </div>
        <div className="h-8" />

        <H2>Coming to App Store soon</H2>
        <div className="h-4" />
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

  const link = parseDaimoLink(url);

  switch (link?.type) {
    case "account": {
      const account = await loadNamedAccount(link.addr);
      if (account == null) return null;
      return { title: `${account.name}`, description: `Pay on Daimo: ${url}` };
    }
    case "request": {
      const recipient = await loadNamedAccount(link.recipient);
      if (recipient == null) return null;
      return {
        title: `${recipient.name} is requesting $${link.amount}`,
        description: `Pay via Daimo.`,
      };
    }
    case "note": {
      const noteInfo = await loadNoteInfo(link.ephemeralOwner);
      if (noteInfo == null) return null;
      return {
        title: `${noteInfo.sender.name} sent you $${noteInfo.amount}`,
        description: `Claim on Daimo.`,
      };
    }
    default: {
      return null;
    }
  }
}

async function loadNoteInfo(ephemeralOwner: string) {
  // TODO: load from TRPC
  return {
    amount: 1.23,
    sender: {
      name: "dcposch",
      addr: "0x061b0a794945fe0ff4b764bfb926317f3cfc8b93",
    },
  };
}

async function loadNamedAccount(addr: string): Promise<NamedAccount | null> {
  // TODO: load from TRPC
  return {
    name: "dcposch",
    addr: "0x061b0a794945fe0ff4b764bfb926317f3cfc8b93",
  };
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
