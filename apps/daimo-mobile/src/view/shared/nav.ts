import {
  DaimoLink,
  DaimoLinkAccount,
  DaimoLinkNote,
  DaimoLinkRequest,
  TransferOpEvent,
  parseDaimoLink,
} from "@daimo/common";
import { NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { addEventListener, getInitialURL } from "expo-linking";
import { useEffect, useRef } from "react";
import { Hex } from "viem";

import { useAccount } from "../../model/account";
import { Recipient } from "../../sync/recipients";

export type QRScreenOptions = "PAY ME" | "SCAN";

export type ParamListHome = {
  Home: undefined;
  QR: { option: QRScreenOptions | undefined };
  HistoryOp: { op: TransferOpEvent };
};

export type ParamListSend = {
  SendNav: { autoFocus: boolean };
  SendTransfer: SendNavProp;
  QR: { option: QRScreenOptions | undefined };
  SendLink: { lagAutoFocus: boolean };
};

export type ParamListReceive = {
  Receive: { autoFocus: boolean };
  RequestSend: undefined;
  Note: { link: DaimoLinkNote };
};

export type ParamListSettings = {
  Settings: undefined;
  AddDevice: undefined;
  AddPasskey: undefined;
  Device: { pubKey: Hex };
};

interface SendNavProp {
  link?: DaimoLinkAccount | DaimoLinkRequest;
  recipient?: Recipient;
  dollars?: `${number}`;
  requestId?: `${bigint}`;
  lagAutoFocus?: boolean;
}

export type ParamListTab = {
  DepositTab: undefined;
  ReceiveTab: NavigatorScreenParams<ParamListReceive>;
  HomeTab: NavigatorScreenParams<ParamListHome>;
  SendTab: NavigatorScreenParams<ParamListSend>;
  SettingsTab: { screen: keyof ParamListSettings; params?: any };
};

export function useNav<
  RouteName extends keyof ParamListTab = keyof ParamListTab
>() {
  return useNavigation<NativeStackNavigationProp<ParamListTab, RouteName>>();
}

export type MainNav = ReturnType<typeof useNav>;

/** Handle incoming app deep links. */
export function useInitNavLinks() {
  const nav = useNav();
  const [account] = useAccount();
  const accountMissing = account == null;

  // Handle the link that opened this app, if any.
  const openedInitialURL = useRef(false);

  useEffect(() => {
    if (accountMissing) return;
    console.log(`[NAV] listening for deep links, account ${account.name}`);

    getInitialURL().then((url) => {
      if (url == null) return;
      if (openedInitialURL.current) return;
      // Workdaround: avoid "The 'navigation' object hasn't been initialized"
      setTimeout(() => handleDeepLink(nav, url), 100);
      openedInitialURL.current = true;
    });

    addEventListener("url", ({ url }) => handleDeepLink(nav, url));
  }, [accountMissing]);
}

export function handleDeepLink(nav: MainNav, url: string) {
  const link = parseDaimoLink(url);
  if (link == null) {
    console.log(`[NAV] skipping unparseable link ${url}`);
    return;
  }

  console.log(`[NAV] going to ${url}`);
  goTo(nav, link);
}

async function goTo(nav: MainNav, link: DaimoLink) {
  const { type } = link;
  switch (type) {
    case "account":
    case "request": {
      nav.navigate("SendTab", { screen: "SendTransfer", params: { link } });
      break;
    }
    case "note": {
      nav.navigate("ReceiveTab", { screen: "Note", params: { link } });
      break;
    }
    default:
      throw new Error(`Unhandled link type ${type}`);
  }
}

export function navResetToHome(nav: MainNav) {
  nav.reset({ routes: [{ name: "HomeTab" }] });
}

export function useDisableTabSwipe(nav: MainNav) {
  useEffect(() => {
    const p = nav.getParent();
    if (p == null) return;

    p.setOptions({ swipeEnabled: false });
    return () => p.setOptions({ swipeEnabled: true });
  }, [nav]);
}
