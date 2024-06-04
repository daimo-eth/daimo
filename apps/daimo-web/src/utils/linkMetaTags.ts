import {
  DaimoRequestState,
  DaimoRequestV2Status,
  assertDaimoRequestV2Status,
  formatDaimoLink,
  getAccountName,
} from "@daimo/common";
import { Metadata } from "next";

import { getAbsoluteUrl } from "./getAbsoluteUrl";
import { LinkStatusDesc } from "./linkStatus";
import {
  FrameButtonMetadata,
  FrameMetadataType,
  getFrameMetadata,
} from "../app/frame/frameUtils";

export function createMetadataForLinkStatus(desc: LinkStatusDesc): Metadata {
  const { name, action, dollars } = desc;

  // Create title
  const prefixedDollars = dollars && `$${dollars}`;
  const title = [name, action, prefixedDollars].filter((x) => x).join(" ");

  // Create image preview
  let paidBy: string | undefined;
  let cancelled = false;
  if (desc.linkStatus != null && desc.linkStatus.link.type === "requestv2") {
    const stat = assertDaimoRequestV2Status(desc.linkStatus);
    paidBy = stat.fulfilledBy && getAccountName(stat.fulfilledBy);
    cancelled = stat.status === "cancelled";
  }
  const previewURL = getPreviewURL(name, action, dollars, paidBy, cancelled);

  const meta = createMetadata(title, desc.description, previewURL);

  // If it's a request, make it frame with button to check status.
  const frameMeta = getFrameForLinkStatus(desc, "Check Status");
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
    // Create image preview
    const { fulfilledBy, status } = linkStatus as DaimoRequestV2Status;
    const paidBy = fulfilledBy && getAccountName(fulfilledBy);
    const cancelled = status === "cancelled";
    const previewURL = getPreviewURL(name, action, dollars, paidBy, cancelled);

    // Create frame buttons
    const isFinalized = [
      DaimoRequestState.Fulfilled,
      DaimoRequestState.Cancelled,
    ].includes(status);
    const linkUrl = formatDaimoLink(linkStatus.link);
    const linkParam = encodeURIComponent(linkUrl);

    let buttons: [FrameButtonMetadata, ...FrameButtonMetadata[]];
    if (isFinalized) {
      buttons = [{ label: "Open in Daimo", action: "link", target: linkUrl }];
    } else {
      buttons = [
        { label: recheckLabel },
        { label: "Pay Request", action: "link", target: linkUrl },
      ];
    }

    return {
      buttons,
      image: previewURL,
      post_url: getAbsoluteUrl(`/frame/link/status?link=${linkParam}`),
    };
  }
}

// Generates a OpenGraph link preview image URL
// The image itself is also generated dynamically -- see preview/route.tsx
// TODO: refactor to take an object, handle account & note links
function getPreviewURL(
  name: string | undefined,
  action: string | undefined,
  dollars: `${number}` | undefined,
  paidBy?: string,
  cancelled?: boolean
) {
  if (!name) {
    return getAbsoluteUrl(`/logo-link-preview.png`);
  }

  let previewURL = getAbsoluteUrl(`/preview?name=${name}`);
  if (action) {
    previewURL = previewURL.concat(`&action=${encodeURIComponent(action)}`);
  }
  if (dollars) {
    previewURL = previewURL.concat(`&dollars=${dollars}`);
  }
  if (paidBy) {
    previewURL = previewURL.concat(`&paidBy=${paidBy}`);
  }
  if (cancelled) {
    previewURL = previewURL.concat(`&cancelled=true`);
  }
  previewURL = previewURL.concat(`&v=2`); // cache bust images with old logo
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
