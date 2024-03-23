import { parseDaimoLink } from "@daimo/common";
import { NextRequest, NextResponse } from "next/server";

import { getFrameForLinkStatus } from "../../../../utils/linkMetaTags";
import { loadLinkStatusDesc } from "../../../../utils/linkStatus";
import { getFrameHtmlResponse } from "../../frameUtils";

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const reqURL = new URL(req.url);
  const rawLink = reqURL.searchParams.get("link");
  console.log(`[FRAME] got link status request: ${rawLink}`);

  const link = parseDaimoLink(rawLink || "");
  if (rawLink == null || link == null) {
    return new NextResponse("Not a Daimo link: " + rawLink, { status: 400 });
  }

  const desc = await loadLinkStatusDesc(rawLink);
  if (desc == null) {
    return new NextResponse("Not found: " + rawLink, { status: 404 });
  }

  const frameMeta = getFrameForLinkStatus(desc, "Unpaid · Check Again");
  if (frameMeta == null) {
    return new NextResponse("No frame for link: " + rawLink, { status: 404 });
  }

  const html = getFrameHtmlResponse(frameMeta);
  return new NextResponse(html, { status: 200 });
}
