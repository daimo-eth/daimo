import { parseDaimoLink } from "@daimo/common";
import { NextRequest, NextResponse } from "next/server"; // Import requestAsyncStorage

import { getI18N } from "../../../../i18n";
import { LanguageDefinition } from "../../../../i18n/languages/en";
import { getFrameForLinkStatus } from "../../../../utils/linkMetaTags";
import { loadLinkStatusDesc } from "../../../../utils/linkStatus";
import { getFrameHtmlResponse } from "../../frameUtils";

export async function GET(req: NextRequest) {
  const lang = req.headers.get("accept-language");
  const i18n = getI18N(lang);
  const i18 = i18n.frame.linkStatus;

  return handle(req, i18);
}

export async function POST(req: NextRequest) {
  const lang = req.headers.get("accept-language");
  const i18n = getI18N(lang);
  const i18 = i18n.frame.linkStatus;

  return handle(req, i18);
}

async function handle(
  req: NextRequest,
  i18: LanguageDefinition["frame"]["linkStatus"]
) {
  const reqURL = new URL(req.url);

  const rawLink = reqURL.searchParams.get("link");
  console.log(`[FRAME] got link status request: ${rawLink}`);

  const link = parseDaimoLink(rawLink || "");
  if (rawLink == null || link == null) {
    return new NextResponse(i18.notDaimoLink() + rawLink, { status: 400 });
  }

  const desc = await loadLinkStatusDesc(rawLink);
  if (desc == null) {
    return new NextResponse(i18.notFound() + rawLink, { status: 404 });
  }

  const frameMeta = getFrameForLinkStatus(desc, "Unpaid · Check Again");
  if (frameMeta == null) {
    return new NextResponse(i18.noFrame() + rawLink, { status: 404 });
  }

  const html = getFrameHtmlResponse(frameMeta);
  return new NextResponse(html, { status: 200 });
}
