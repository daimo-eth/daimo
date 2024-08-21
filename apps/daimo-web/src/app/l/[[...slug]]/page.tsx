/* eslint-disable @next/next/no-img-element */
import { debugJson, formatDaimoLink, parseDaimoLinkType } from "@daimo/common";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import LinkPage from "./LinkPage";
import { getUrl, LinkPageProps } from "./LinkPageProps";
import { getI18N } from "../../../i18n";
import { LangDef } from "../../../i18n/languages/en";
import { getReqHeaders, getReqLang } from "../../../i18n/server";
import { getAbsoluteUrl } from "../../../utils/getAbsoluteUrl";
import { loadPFPUrl } from "../../../utils/getProfilePicture";
import {
  createMetadata,
  createMetadataForLinkStatus,
} from "../../../utils/linkMetaTags";
import { loadLinkStatusDesc } from "../../../utils/linkStatus";

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: LinkPageProps
): Promise<Metadata> {
  console.log(`[LINK] req headers: ${debugJson(getReqHeaders())}`);
  const i18n = getI18N(getReqLang());
  const url = getUrl(props);
  const desc = await loadLinkStatusDesc(url);

  if (desc == null) return defaultMeta(i18n);
  if (parseDaimoLinkType(url) === "t" && desc?.linkStatus?.link) {
    console.log(`[LINK] redirecting tag to ${desc.linkStatus.link}`);
    redirect(formatDaimoLink(desc.linkStatus.link));
  }

  return createMetadataForLinkStatus(desc);
}

function defaultMeta(i18n: LangDef) {
  const title = i18n.meta.title();
  const desc = i18n.meta.description();
  return createMetadata(title, desc, getAbsoluteUrl(`/logo-link-preview.png`));
}

export default async function LinkPageWrap(props: LinkPageProps) {
  const statusDesc = await loadLinkStatusDesc(getUrl(props));
  const { name } = statusDesc || {};
  const pfp = name && (await loadPFPUrl(name));

  return <LinkPage lang={getReqLang()} {...{ statusDesc, pfp }} />;
}
