import { ImageResponse } from "@vercel/og";

import { InvitePreviewImg } from "../../../../../components/image-gen/InvitePreview";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("name")) {
    throw new Error("Invalid preview params");
  }
  const name = searchParams.get("name");

  return new ImageResponse(<InvitePreviewImg name={name!} />, {
    width: 1086,
    height: 569,
  });
}
