import {
  DaimoRequestState,
  DaimoRequestV2Status,
  formatDaimoLink,
} from "@daimo/common";
import { Metadata } from "next";

import { getAbsoluteUrl } from "./getAbsoluteUrl";
import { LinkStatusDesc } from "./linkStatus";
import { FrameMetadataType, getFrameMetadata } from "../app/frame/frameUtils";

export function createMetadataForLinkStatus(desc: LinkStatusDesc): Metadata {
  const { name, action, dollars } = desc;
  const prefixedDollars = dollars && `$${dollars}`;
  const title = [name, action, prefixedDollars].filter((x) => x).join(" ");
  const previewURL = getPreviewURL(name, action, dollars);

  const meta = createMetadata(title, desc.description, previewURL);

  // If it's a request, make it frame with button to check status.
  const frameMeta = getFrameForLinkStatus(desc, "✳️ Check status");
  console.log(
    `[LINK] status ${JSON.stringify(desc)}, frame ${JSON.stringify(frameMeta)}`
  );
  if (frameMeta) meta.other = getFrameMetadata(frameMeta);

  return meta;
}

export function getFrameForLinkStatus(
  desc: LinkStatusDesc,
  recheckLabel: string
): FrameMetadataType | undefined {
  const { name, action, dollars, linkStatus } = desc;

  // If it's a request, make it frame with button to check status.
  if (linkStatus && linkStatus.link.type === "requestv2") {
    const previewURL = getPreviewURL(name, action, dollars);
    const { status } = linkStatus as DaimoRequestV2Status;
    const isFinalized = [
      DaimoRequestState.Fulfilled,
      DaimoRequestState.Cancelled,
    ].includes(status);
    const linkArg = encodeURIComponent(formatDaimoLink(linkStatus.link));
    return {
      buttons: isFinalized ? undefined : [{ label: recheckLabel }],
      image: previewURL,
      post_url: getAbsoluteUrl(`/frame/link/status?link=${linkArg}`),
    };
  }
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
  return previewURL;
}

export function createMetadata(
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
