import {
  LinkInviteStatus,
  getInviteStatus,
  parseInviteCodeOrLink,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";

import { useDaimoChain } from "./accountManager";
import { useFetchLinkStatus } from "./linkStatus";
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
      nav.navigate("CreatePickName", { inviteLink });
    } else {
      setPasteLinkError("Copy link & try again.");
    }
  };

  return { pasteInviteLink, pasteLinkError };
}

// Handle invite code or link input, looks up the code, checks validity.
export function useOnboardingInviteCode(str: string) {
  const inviteLink = useMemo(() => parseInviteCodeOrLink(str), [str]);
  const daimoChain = useDaimoChain();
  const linkStatus = useFetchLinkStatus(inviteLink, daimoChain);

  const [inviteStatus, setInviteStatus] = useState<LinkInviteStatus>();
  useEffect(() => {
    if (linkStatus.data != null) {
      setInviteStatus(getInviteStatus(linkStatus.data));
    }
  }, [linkStatus]);

  // HACK: connect to testnet with a special invite code
  if (str === "testnet") {
    return {
      inviteLink,
      inviteStatus: { isValid: true },
      daimoChain: "baseSepolia" as DaimoChain,
    };
  }
  return { inviteLink, inviteStatus, daimoChain };
}
