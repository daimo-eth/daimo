import { DaimoLink, parseDaimoLink } from "@daimo/client";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useURL } from "expo-linking";
import { useEffect } from "react";
import { Address } from "viem";

import { OpEvent } from "../../model/op";
import { Recipient, getRecipient } from "../../sync/loadRecipients";

export type HomeStackParamList = {
  Home: undefined;
  Account: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient; dollars?: number };
  Withdraw: undefined;
  Request: undefined;
  Deposit: undefined;
  Note:
    | undefined
    | {
        ephemeralPrivateKey: `0x${string}` | undefined;
        ephemeralOwner: Address | undefined;
      };
  RequestSend: undefined;
  History: undefined;
  HistoryOp: { op: OpEvent };
};

export function useNav() {
  return useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
}

export function useHandleNavLinks() {
  const nav = useNav();
  const url = useURL();

  useEffect(() => {
    if (url == null) return;
    const link = parseDaimoLink(url);
    if (link == null) {
      console.warn(`[NAV] ignoring link ${url}`);
      return;
    }

    console.log(`[NAV] going to ${url}`);
    goTo(nav, link);
  }, [url]);
}

async function goTo(nav: ReturnType<typeof useNav>, link: DaimoLink) {
  const { type } = link;
  switch (type) {
    case "account": {
      const recipient = await getRecipient(link.addr);
      nav.replace("Send", { recipient });
      break;
    }
    case "request": {
      const recipient = await getRecipient(link.recipient);
      const dollars = parseFloat(link.amount);
      nav.replace("Send", { recipient, dollars });
      break;
    }
    case "note": {
      nav.replace("Note", {
        ephemeralPrivateKey: link.ephemeralPrivateKey,
        ephemeralOwner: link.ephemeralOwner,
      });
      break;
    }
    default:
      throw new Error(`Unhandled link type ${type}`);
  }
}
