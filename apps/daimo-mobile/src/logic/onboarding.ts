import { parseInviteCodeOrLink } from "@daimo/common";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

import { useOnboardingNav } from "../common/nav";

// Handles invite paste.
export function useOnboardingPasteInvite() {
  const nav = useOnboardingNav();

  // Paste invite
  const [pasteLinkError, setPasteLinkError] = useState("");
  const pasteInviteLink = async () => {
    const str = await Clipboard.getStringAsync();
    const inviteLink = parseInviteCodeOrLink(str);
    console.log(`[INTRO] paste invite link: '${str}'`);
    if (inviteLink) {
      setPasteLinkError("");
      nav.navigate("CreatePickName", { inviteLink });
    } else {
      setPasteLinkError("Copy link & try again.");
    }
  };

  return { pasteInviteLink, pasteLinkError };
}
