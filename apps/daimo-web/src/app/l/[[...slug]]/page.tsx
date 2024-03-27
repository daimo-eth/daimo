import { daimoLinkBaseV2 } from "@daimo/common";
import { Metadata } from "next";
import Image from "next/image";

import { CallToAction } from "../../../components/CallToAction";
import { Providers, chainsDaimoL2 } from "../../../components/Providers";
import { getAbsoluteUrl } from "../../../utils/getAbsoluteUrl";
import {
  createMetadata,
  createMetadataForLinkStatus,
} from "../../../utils/linkMetaTags";
import { loadLinkStatusDesc } from "../../../utils/linkStatus";

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

type LinkProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

const defaultMeta = createMetadata(
  "Daimo",
  "Payments on Ethereum",
  getAbsoluteUrl(`/logo-link-preview.png`)
);

function getUrl(props: LinkProps): string {
  const path = (props.params.slug || []).join("/");
  const queryString = new URLSearchParams(
    props.searchParams as Record<string, string>
  ).toString();
  return `${daimoLinkBaseV2}/${path}?${queryString}`;
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const url = getUrl(props);
  const desc = await loadLinkStatusDesc(url);
  if (desc == null) return defaultMeta;
  return createMetadataForLinkStatus(desc);
}

export default async function LinkPage(props: LinkProps) {
  return (
    <Providers chains={chainsDaimoL2}>
      <LinkPageInner {...props} />
    </Providers>
  );
}

async function LinkPageInner(props: LinkProps) {
  const { name, action, dollars, description, linkStatus, memo } =
    (await loadLinkStatusDesc(getUrl(props))) || {
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
        {memo && (
          <>
            <div className="h-4" />
            <p className="text-xl italic font-semibold text-grayMid">{memo}</p>
          </>
        )}
        <div className="h-9" />
        <CallToAction {...{ description, linkStatus }} />
      </center>
    </main>
  );
}
