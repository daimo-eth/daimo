import {
  DaimoLink,
  DaimoLinkAccount,
  DaimoLinkNote,
  DaimoLinkNoteV2,
  DaimoLinkRequest,
  DaimoLinkRequestV2,
  DaimoLinkTag,
  DisplayOpEvent,
  EAccount,
  parseDaimoLink,
  getEAccountStr,
} from "@daimo/common";
import { NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { Hex } from "viem";

import { EAccountContact, MsgContact } from "../../logic/daimoContacts";

export type QRScreenOptions = "PAY ME" | "SCAN";

export type ParamListHome = {
  Home: undefined;
  QR: { option: QRScreenOptions | undefined };
  Account:
    | { eAcc: EAccount; inviterEAcc: EAccount | undefined }
    | { link: DaimoLinkAccount };
  HistoryOp: { op: DisplayOpEvent };
};

type ParamListError = {
  displayTitle: string;
  displayMessage: string;
  showDownloadButton?: boolean;
  screen?: string;
  params?: any;
};

export type ParamListMain = {
  MainTabNav: ParamListTab;
  LinkErrorModal: ParamListError;
};

type NavigatorParamList = {
  LinkErrorModal: ParamListError;
  DepositTab: undefined;
  ReceiveTab: NavigatorScreenParams<ParamListReceive>;
  HomeTab: NavigatorScreenParams<ParamListHome>;
  SendTab: NavigatorScreenParams<ParamListSend>;
  SettingsTab: { screen: keyof ParamListSettings; params?: any };
};

export type ParamListSend = {
  SendNav: { autoFocus: boolean };
  SendTransfer: SendNavProp;
  QR: { option: QRScreenOptions | undefined };
  SendLink: { recipient?: MsgContact; lagAutoFocus: boolean };
  Account:
    | { eAcc: EAccount; inviterEAcc: EAccount | undefined }
    | { link: DaimoLinkAccount };
  HistoryOp: { op: DisplayOpEvent };
};

export type ParamListReceive = {
  Receive: { autoFocus: boolean };
  RequestSend: undefined;
  Note: { link: DaimoLinkNote | DaimoLinkNoteV2 };
};

export type ParamListSettings = {
  Settings: undefined;
  AddDevice: undefined;
  AddPasskey: undefined;
  Device: { pubKey: Hex };
};

export interface SendNavProp {
  link?:
    | DaimoLinkAccount
    | DaimoLinkRequest
    | DaimoLinkRequestV2
    | DaimoLinkTag;
  recipient?: EAccountContact;
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

export const defaultError = {
  type: "error" as "error",
  displayTitle: "This link is unsupported",
  displayMessage:
    "Check if you have an old version of the app or if there are any errors in your URL",
  showDownloadButton: true,
};

export type ParamListBottomSheet = {
  BottomSheetList: undefined;
  BottomSheetHistoryOp: {
    op: DisplayOpEvent;
    shouldAddInset: boolean;
  };
};

export function useNav<
  RouteName extends keyof NavigatorParamList = keyof NavigatorParamList
>() {
  return useNavigation<
    NativeStackNavigationProp<NavigatorParamList, RouteName>
  >();
}

export type MainNav = ReturnType<typeof useNav>;

export function handleDeepLink(nav: MainNav, url: string) {
  const link = parseDaimoLink(url);
  if (link == null) {
    console.log(`[NAV] skipping unparseable link ${url}`);
    nav.navigate("LinkErrorModal", defaultError);
    return;
  }

  console.log(`[NAV] going to ${url}`);
  goTo(nav, link);
}

async function goTo(nav: MainNav, link: DaimoLink) {
  const { type } = link;
  switch (type) {
    case "settings": {
      const screen = (() => {
        if (link.screen === "add-passkey") return "AddPasskey";
        else if (link.screen === "add-device") return "AddDevice";
        else return "Settings";
      })();

      // HACK: make the back button from Add[Passkey,...] go directly to Home.
      nav.reset({ routes: [{ name: "SettingsTab", params: { screen } }] });
      break;
    }
    case "account": {
      nav.navigate("HomeTab", { screen: "Account", params: { link } });
      break;
    }
    case "request":
    case "requestv2": {
      nav.navigate("SendTab", { screen: "SendTransfer", params: { link } });
      break;
    }
    case "note": {
      nav.navigate("ReceiveTab", { screen: "Note", params: { link } });
      break;
    }
    case "notev2": {
      nav.navigate("ReceiveTab", { screen: "Note", params: { link } });
      break;
    }
    case "tag": {
      nav.navigate("SendTab", { screen: "SendTransfer", params: { link } });
      break;
    }
    default:
      throw new Error(`Unhandled link type ${type}`);
  }
}

export function useExitToHome() {
  const nav = useNav();
  return useCallback(() => {
    nav.navigate("HomeTab", { screen: "Home" });
    if (!nav.canGoBack()) return;
    if (Platform.OS === "ios") {
      setTimeout(() => nav.popToTop(), 400);
    } else {
      nav.popToTop();
    }
  }, []);
}

export function useExitBack() {
  const nav = useNav();
  const goBack = useCallback(() => nav.goBack(), []);
  return nav.canGoBack() ? goBack : undefined;
}

export function useDisableTabSwipe(nav: MainNav) {
  useEffect(() => {
    const p = nav.getParent();
    if (p == null) return;

    p.setOptions({ swipeEnabled: false });
    return () => p.setOptions({ swipeEnabled: true });
  }, [nav]);
}

/* We can't use `autoLagFocus` because tabs persist state, so we need to use
 * a seperate hook that clears tab state without unmounting the component.
 * Assumes current nav has a params for `autoFocus`. */
export function useFocusOnScreenTransitionEnd(
  ref: React.RefObject<any>,
  nav: MainNav,
  isFocused: boolean,
  autoFocus: boolean
) {
  useEffect(() => {
    const unsubscribe = nav.addListener("transitionEnd", () => {
      if (isFocused && autoFocus) {
        ref.current?.focus();

        // Now, wipe the autoFocus flag so that switching tab and coming back
        // doesn't keep focusing the input.
        nav.setParams({ autoFocus: false } as any);
      }
    });

    return unsubscribe;
  }, [isFocused, autoFocus]);
}

// Open account page within the same tab.
export function navToAccountPage(account: EAccount, nav: MainNav) {
  // Workaround: react-navigation typescript types are broken.
  // currentTab is eg "SendNav", is NOT in fact a ParamListTab:
  const currentTab = nav.getState().routes[0].name;
  const newTab = currentTab.startsWith("Send") ? "SendTab" : "HomeTab";
  const accountLink = {
    type: "account",
    account: getEAccountStr(account),
  } as DaimoLinkAccount;
  nav.navigate(newTab, { screen: "Account", params: { link: accountLink } });
}
