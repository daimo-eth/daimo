import { NamedAccount, daimoLinkBase, parseDaimoLink } from "@daimo/api";
import { Metadata } from "next";
import Image from "next/image";

import { AppStoreBadge } from "../../../components/AppStoreBadge";
import { H1 } from "../../../components/typography";

type LinkParams = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

const domain = process.env.NEXT_PUBLIC_DOMAIN;

const defaultMeta = metadata("Daimo", "Experimental stablecoin wallet");

export async function generateMetadata({
  params,
}: LinkParams): Promise<Metadata> {
  const path = (params.slug || []).join("/");
  const url = `${daimoLinkBase}/${path}`;

  const link = parseDaimoLink(url);

  switch (link?.type) {
    case "account": {
      const account = await loadNamedAccount(link.addr);
      if (account == null) return defaultMeta;
      return metadata(`${account.name}`, `Pay on Daimo: ${url}`);
    }
    case "request": {
      const recipient = await loadNamedAccount(link.recipient);
      if (recipient == null) return defaultMeta;
      return metadata(
        `${recipient.name} is requesting ${link.amount}`,
        `Pay on Daimo: ${url}`
      );
    }
    case "note": {
      const noteInfo = await loadNoteInfo(link.ephemeralOwner);
      if (noteInfo == null) return defaultMeta;
      return metadata(
        `${noteInfo.sender.name} sent you $${noteInfo.amount}`,
        `Claim on Daimo: ${url}`
      );
    }
    default: {
      return defaultMeta;
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
          width: 200,
          height: 200,
          alt: "Daimo",
        },
      ],
      type: "website",
    },
  };
}

export default function LinkPage({ params }: LinkParams) {
  const path = (params.slug || []).join("/");

  return (
    <main className="max-w-sm mx-auto">
      <center>
        <div className="h-16" />
        <Image src="/logo-web.png" alt="Daimo" width="200" height="200" />

        <div className="h-16" />
        <div className="flex flex-row gap-4 justify-center">
          <AppStoreBadge platform="ios" />
          <AppStoreBadge platform="android" />
        </div>
        <div className="h-8" />

        <H1>App store coming soon</H1>
        <div className="h-4" />
        <p>
          Till then, message <strong>dcposch</strong> on Telegram
          <br />
          to try the TestFlight.
          <br />
        </p>
        <div className="h-4" />
        <p className="text-sm font-mono rounded-sm bg-lightGray">{path}</p>
      </center>
    </main>
  );
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
