import {
  DaimoLink,
  DaimoLinkAccount,
  DaimoLinkNote,
  DaimoLinkRequest,
  OpEvent,
  parseDaimoLink,
} from "@daimo/common";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { addEventListener, getInitialURL } from "expo-linking";
import { useEffect } from "react";
import { Hex } from "viem";

import { useAccount } from "../../model/account";
import { Recipient } from "../../sync/recipients";

export type HomeStackParamList = {
  Home: undefined;
  Settings: undefined;
  Chain: undefined;
  Send: SendNavProp;
  Withdraw: undefined;
  Request: undefined;
  Deposit: undefined;
  Note: { link: DaimoLinkNote };
  RequestSend: undefined;
  History: undefined;
  HistoryOp: { op: OpEvent };
  AddDevice: undefined;
  Device: { pubKey: Hex };
};

interface SendNavProp {
  link?: DaimoLinkAccount | DaimoLinkRequest;
  recipient?: Recipient;
  dollars?: `${number}`;
  requestId?: `${bigint}`;
}

export function useNav<
  RouteName extends keyof HomeStackParamList = keyof HomeStackParamList
>() {
  return useNavigation<
    NativeStackNavigationProp<HomeStackParamList, RouteName>
  >();
}

export type HomeStackNav = ReturnType<typeof useNav>;

/** Handle incoming app deep links. */
export function useInitNavLinks() {
  const nav = useNav();
  const [account] = useAccount();
  const accountMissing = account == null;

  useEffect(() => {
    if (accountMissing) return;
    console.log(`[NAV] listening for deep links, account ${account.name}`);
    getInitialURL().then((url) => {
      // Workdaround: avoid "The 'navigation' object hasn't been initialized"
      if (url == null) return;
      setTimeout(() => handleDeepLink(nav, url), 100);
    });
    addEventListener("url", ({ url }) => handleDeepLink(nav, url));
  }, [accountMissing]);
}

export function handleDeepLink(nav: HomeStackNav, url: string) {
  const link = parseDaimoLink(url);
  if (link == null) {
    console.log(`[NAV] skipping unparseable link ${url}`);
    return;
  }

  console.log(`[NAV] going to ${url}`);
  goTo(nav, link);
}

async function goTo(nav: HomeStackNav, link: DaimoLink) {
  const { type } = link;
  switch (type) {
    case "account":
    case "request": {
      nav.navigate("Send", { link });
      break;
    }
    case "note": {
      nav.navigate("Note", { link });
      break;
    }
    default:
      throw new Error(`Unhandled link type ${type}`);
  }
}
