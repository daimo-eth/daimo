import {
  DaimoLinkInvite,
  DaimoLinkNoteV2,
  parseDaimoLink,
} from "@daimo/common";

/* Interpret text as a potential invite link */
export function getInvitePasteLink(
  text: string
): DaimoLinkInvite | DaimoLinkNoteV2 | undefined {
  // Check if its a valid Daimo link
  const link = parseDaimoLink(text);
  if (link && (link.type === "invite" || link.type === "notev2")) return link;
  return { type: "invite", code: text };
}
