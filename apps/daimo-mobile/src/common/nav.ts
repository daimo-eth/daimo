import {
  DaimoLink,
  DaimoLinkAccount,
  DaimoLinkInviteCode,
  DaimoLinkNote,
  DaimoLinkNoteV2,
  DaimoLinkRequest,
  DaimoLinkRequestV2,
  DaimoLinkTag,
  DisplayOpEvent,
  EAccount,
  getEAccountStr,
  parseDaimoLink,
  parseInviteCodeOrLink,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { URLListener, addEventListener } from "expo-linking";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { Hex } from "viem";

import { EAccountContact, MsgContact } from "../logic/daimoContacts";
import {
  getInitialDeepLink,
  markInitialDeepLinkHandled,
} from "../logic/deeplink";
import { fetchInviteLinkStatus } from "../logic/linkStatus";

export type ParamListOnboarding = {
  Intro: undefined;
  CreateNew: undefined;
  CreatePickName: { inviteLink: DaimoLink };
  CreateSetupKey: { inviteLink: DaimoLink };
  ExistingSetupKey: undefined;
  UseExisting: undefined;
  AllowNotifs: undefined;
  Finish: undefined;
};

export type QRScreenOptions = "PAY ME" | "SCAN";

export type ParamListHome = {
  Home: undefined;
  QR: { option: QRScreenOptions | undefined };
  Profile:
    | { eAcc: EAccount; inviterEAcc: EAccount | undefined }
    | { link: DaimoLinkAccount | DaimoLinkInviteCode };
  HistoryOp: { op: DisplayOpEvent };
  Receive: { autoFocus: boolean; recipient?: EAccountContact | MsgContact };
  Note: { link: DaimoLinkNote | DaimoLinkNoteV2 };
  ReceiveNav: undefined;
  Notifications: undefined;
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
  InviteTab: NavigatorScreenParams<ParamListInvite>;
  HomeTab: NavigatorScreenParams<ParamListHome>;
  SendTab: NavigatorScreenParams<ParamListSend>;
  SettingsTab: { screen: keyof ParamListSettings; params?: any };
};

export type ParamListSend = {
  SendNav: { autoFocus: boolean };
  SendTransfer: SendNavProp;
  QR: { option: QRScreenOptions | undefined };
  SendLink: { recipient?: MsgContact };
  Profile:
    | { eAcc: EAccount; inviterEAcc: EAccount | undefined }
    | { link: DaimoLinkAccount };
  HistoryOp: { op: DisplayOpEvent };
};

export type ParamListInvite = {
  Invite: undefined;
  YourInvites: undefined;
  Profile:
    | { eAcc: EAccount; inviterEAcc: EAccount | undefined }
    | { link: DaimoLinkAccount };
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
  memo?: string;
  requestId?: `${bigint}`;
  autoFocus?: boolean;
}

export type ParamListTab = {
  DepositTab: undefined;
  InviteTab: NavigatorScreenParams<ParamListInvite>;
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

type AllRoutes = NavigatorParamList &
  ParamListHome &
  ParamListSend &
  ParamListInvite &
  ParamListSettings;

export function useNav<RouteName extends keyof AllRoutes = keyof AllRoutes>() {
  return useNavigation<NativeStackNavigationProp<AllRoutes, RouteName>>();
}

export function useOnboardingNav<
  RouteName extends keyof ParamListOnboarding = keyof ParamListOnboarding
>() {
  return useNavigation<
    NativeStackNavigationProp<ParamListOnboarding, RouteName>
  >();
}

export type MainNav = ReturnType<typeof useNav>;

type OnboardingNav = ReturnType<typeof useOnboardingNav>;

// Handles deeplinks during onboarding, if any.
export function useOnboardingDeepLinkHandler(dc: DaimoChain) {
  const nav = useOnboardingNav();

  // If we opened the app by clicking an invite link, go straight into onboarding.
  const navToInitialInviteDeepLinkIfPresent = async () => {
    const deeplink = await getInitialDeepLink();
    if (deeplink == null) return;
    // Use invite / payment link now > don't nav there after onboarding
    await handleOnboardingDeepLink(dc, nav, deeplink);
    markInitialDeepLinkHandled();
  };

  useEffect(() => {
    navToInitialInviteDeepLinkIfPresent();
    const listener: URLListener = ({ url }) =>
      handleOnboardingDeepLink(dc, nav, url);
    const sub = addEventListener("url", listener);
    return () => sub.remove();
  }, []);
}

export async function handleOnboardingDeepLink(
  dc: DaimoChain,
  nav: OnboardingNav,
  str: string
) {
  const inviteLink = parseInviteCodeOrLink(str);
  console.log(`[INTRO] paste invite link: '${str}'`);
  const isAndroid = Platform.OS === "android";
  if (inviteLink && (await fetchInviteLinkStatus(dc, inviteLink))?.isValid) {
    if (isAndroid) nav.navigate("CreateSetupKey", { inviteLink });
    else nav.navigate("CreatePickName", { inviteLink });
  } else {
    nav.navigate("CreateNew");
  }
}

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
      nav.navigate("HomeTab", { screen: "Profile", params: { link } });
      break;
    }
    case "request":
    case "requestv2": {
      nav.navigate("SendTab", { screen: "SendTransfer", params: { link } });
      break;
    }
    case "note": {
      nav.navigate("HomeTab", { screen: "Note", params: { link } });
      break;
    }
    case "notev2": {
      nav.navigate("HomeTab", { screen: "Note", params: { link } });
      break;
    }
    case "tag": {
      nav.navigate("SendTab", { screen: "SendTransfer", params: { link } });
      break;
    }
    case "invite": {
      nav.navigate("HomeTab", { screen: "Profile", params: { link } });
      break;
    }
    default:
      throw new Error(`Unhandled link type ${type}`);
  }
}

export function useExitToHome() {
  const nav = useNav();
  return useCallback(() => {
    console.log(`[NAV] exiting with reset to home`);
    nav.reset({ routes: [{ name: "HomeTab", params: { screen: "Home" } }] });
  }, []);
}

export function useExitBack() {
  const nav = useNav();
  const goBack = useCallback(() => nav.goBack(), []);
  return nav.canGoBack() ? goBack : undefined;
}

// Open account page within the same tab.
export function navToAccountPage(account: EAccount, nav: MainNav) {
  const accountLink = {
    type: "account",
    account: getEAccountStr(account),
  } as DaimoLinkAccount;

  nav.push("Profile", { link: accountLink });
}
