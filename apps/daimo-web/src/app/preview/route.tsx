/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";

import { LinkPreviewImg } from "../../components/image-gen/LinkPreview";
import { loadPFPUrl } from "../../utils/getProfilePicture";

export const runtime = "edge";

// Generate link preview image
// Note that a lot of usual CSS is unsupported, including tailwind.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("name")) {
    throw new Error("Invalid preview params");
  }

  const name = searchParams.get("name")!;
  const action = searchParams.get("action") || undefined;
  const dollars = searchParams.has("dollars")
    ? Number(searchParams.get("dollars")).toFixed(2)
    : undefined;
  const paidBy = searchParams.get("paidBy") || undefined;
  const cancelled = !!searchParams.get("cancelled");
  const pfpUrl = name ? await loadPFPUrl(name) : undefined;

  return new ImageResponse(
    (
      <LinkPreviewImg
        {...{ name, action, dollars, pfpUrl, paidBy, cancelled }}
      />
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
