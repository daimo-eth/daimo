import {
  DaimoLink,
  DaimoLinkAccount,
  DaimoLinkInviteCode,
  DaimoLinkNote,
  DaimoLinkNoteV2,
  DaimoLinkRequest,
  DaimoLinkRequestV2,
  DaimoLinkTag,
  EAccount,
  MoneyEntry,
  TransferClog,
  getEAccountStr,
  parseDaimoLink,
  parseInviteCodeOrLink,
} from "@daimo/common";
import { DaimoChain, ForeignToken, daimoChainFromId } from "@daimo/contract";
import { NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { URLListener, addEventListener } from "expo-linking";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { Hex } from "viem";

import { Dispatcher } from "../action/dispatch";
import { BankTransferOptions } from "../logic/bankTransferOptions";
import {
  DaimoContact,
  EAccountContact,
  LandlineBankAccountContact,
  MsgContact,
} from "../logic/daimoContacts";
import {
  getInitialDeepLink,
  markInitialDeepLinkHandled,
} from "../logic/deeplink";
import { fetchInviteLinkStatus, fetchLinkStatus } from "../logic/linkStatus";
import { Account } from "../storage/account";

export type ParamListOnboarding = {
  Intro: undefined;
  CreateNew: undefined;
  CreateChooseName: { inviteLink: DaimoLink };
  CreateSetupKey: { inviteLink: DaimoLink };
  Existing: undefined;
  ExistingSetupKey: undefined;
  ExistingChooseAccount: undefined;
  ExistingUseBackup: { targetEAcc: EAccount };
  ExistingSeedPhrase: { targetAccount: Account };
  AllowNotifs: { showProgressBar: boolean };
  Finish: undefined;
};

export type QRScreenOptions = "PayMe" | "Scan";

export type ParamListHome = {
  Home: undefined;
  QR: { option: QRScreenOptions | undefined };
  Profile:
    | { eAcc: EAccount; inviterEAcc: EAccount | undefined }
    | { link: DaimoLinkAccount | DaimoLinkInviteCode };
  HistoryOp: { op: TransferClog };
  Receive: { autoFocus: boolean; fulfiller?: DaimoContact };
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
  DepositTab: NavigatorScreenParams<ParamListDeposit>;
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
  HistoryOp: { op: TransferClog };
};

export type ParamListDeposit = {
  Deposit: undefined;
  LandlineTransfer: LandlineTransferNavProp;
  BitrefillWebView: undefined;
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
  Device: { pubKey: Hex };
  SeedPhrase: undefined;
};

export interface SendNavProp {
  link?:
    | DaimoLinkAccount
    | DaimoLinkRequest
    | DaimoLinkRequestV2
    | DaimoLinkTag;
  recipient?: EAccountContact;
  money?: MoneyEntry;
  toCoin?: ForeignToken;
  memo?: string;
  requestId?: `${bigint}`;
  autoFocus?: boolean;
  edit?: "money" | "memo" | "coin";
}

export interface LandlineTransferNavProp {
  recipient: LandlineBankAccountContact;
  money?: MoneyEntry;
  memo?: string;
  bankTransferOption?: BankTransferOptions;
  depositStatus?: ShouldFastFinishResponse;
}

export type ShouldFastFinishResponse = {
  shouldFastFinish: boolean;
  reason: "tx-limit" | "monthly-limit" | null;
};

export type ParamListTab = {
  DepositTab: NavigatorScreenParams<ParamListDeposit>;
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
}; // TODO: Implement i18n

export type ParamListBottomSheet = {
  BottomSheetList: undefined;
  BottomSheetHistoryOp: {
    op: TransferClog;
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
  console.log(`[INTRO] paste invite link: '${str}'`);
  try {
    const inviteLink = parseInviteCodeOrLink(str);
    if (!inviteLink) {
      console.log(`[INTRO] skipping unparseable invite link/code ${str}`);
      nav.navigate("CreateNew");
      return;
    }
    console.log(`[INTRO] parsed invite link: ${JSON.stringify(inviteLink)}`);

    const linkStatus = await fetchInviteLinkStatus(dc, inviteLink);
    const isAndroid = Platform.OS === "android";
    if (linkStatus?.isValid) {
      if (isAndroid) nav.navigate("CreateSetupKey", { inviteLink });
      else nav.navigate("CreateChooseName", { inviteLink });
    } else {
      console.log(`[INTRO] invite ${str} is no longer valid.`);
      nav.navigate("CreateNew");
    }
  } catch (e) {
    console.log(`[INTRO] error handling invite link: ${e}`);
    nav.navigate("CreateNew");
  }
}

export function handleDeepLink(
  nav: MainNav,
  dispatcher: Dispatcher,
  url: string,
  homeChainId: number
) {
  const link = parseDaimoLink(url);
  if (link == null) {
    console.log(`[NAV] skipping unparseable link ${url}`);
    nav.navigate("LinkErrorModal", defaultError);
    return;
  }

  console.log(`[NAV] going to ${url}`);
  goTo(nav, dispatcher, link, homeChainId);
}

async function goTo(
  nav: MainNav,
  dispatcher: Dispatcher,
  link: DaimoLink,
  homeChainId: number
) {
  const { type } = link;
  switch (type) {
    case "settings": {
      const screen = link.screen === "add-device" ? "AddDevice" : "Settings";

      nav.navigate("SettingsTab", { screen });
      if (link.screen === "add-passkey") {
        nav.navigate("Settings");
        dispatcher.dispatch({ name: "createBackup" });
      }

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
      // TODO: pass link status through so child pages don't need to fetch status again
      const linkStatus = await fetchLinkStatus(
        link,
        daimoChainFromId(homeChainId)
      );
      goTo(nav, dispatcher, linkStatus.link, homeChainId);
      break;
    }
    case "invite": {
      nav.navigate("HomeTab", { screen: "Profile", params: { link } });
      break;
    }
    case "deposit": {
      nav.navigate("DepositTab", { screen: "Deposit" });
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

  if (nav.push) nav.push("Profile", { link: accountLink });
  else nav.navigate("Profile", { link: accountLink });
}
