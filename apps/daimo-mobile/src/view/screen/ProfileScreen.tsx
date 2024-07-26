import {
  AddrLabel,
  DaimoLinkAccount,
  DaimoLinkInviteCode,
  EAccount,
  assert,
  canRequestFrom,
  canSendTo,
  getAccountName,
  getAddressContraction,
  getEAccountStr,
  timeMonth,
} from "@daimo/common";
import { daimoChainFromId, teamDaimoFaucetAddr } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { HistoryListSwipe } from "./history/HistoryList";
import {
  ParamListHome,
  navToAccountPage,
  useExitBack,
  useExitToHome,
  useNav,
} from "../../common/nav";
import { TranslationFunctions } from "../../i18n/i18n-types";
import { addLastTransferTimes } from "../../logic/daimoContacts";
import { shareURL } from "../../logic/externalAction";
import { useI18n } from "../../logic/i18n";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../storage/account";
import { ContactBubble } from "../shared/Bubble";
import { ButtonBig } from "../shared/Button";
import { ExplorerBadge } from "../shared/ExplorerBadge";
import { FarcasterButton } from "../shared/FarcasterBubble";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { SwipeUpDownRef } from "../shared/SwipeUpDown";
import { ErrorBanner } from "../shared/error";
import { color, ss } from "../shared/style";
import { TextBody, TextH2 } from "../shared/text";
import { useSwipeUpDown } from "../shared/useSwipeUpDown";
import { useWithAccount } from "../shared/withAccount";

type Props = NativeStackScreenProps<ParamListHome, "Profile">;

export function ProfileScreen(props: Props) {
  const Inner = useWithAccount(ProfileScreenInner);
  return <Inner {...props} />;
}

function ProfileScreenInner(props: Props & { account: Account }) {
  const goBack = useExitBack();
  const goHome = useExitToHome();
  const i18n = useI18n();

  const { params } = props.route;

  const onShare = useMemo(() => {
    if (!("eAcc" in params && params.eAcc)) return;
    const accountName = getEAccountStr(params.eAcc);

    return () => {
      shareURL({ type: "account", account: accountName });
      console.log(`[PROFILE] triggered share`);
    };
  }, [params]);

  return (
    <View style={[ss.container.screen, styles.noPadding]}>
      <View style={styles.screenPadding}>
        <ScreenHeader
          title={i18n.profile.screenHeader()}
          onBack={goBack || goHome}
          onShare={onShare}
        />
      </View>
      <Spacer h={32} />
      {"link" in params && (
        <ProfileScreenLoader
          account={props.account}
          link={params.link}
          _i18n={i18n}
        />
      )}
      {"eAcc" in params && (
        <ProfileScreenBody
          account={props.account}
          eAcc={params.eAcc}
          inviterEAcc={params.inviterEAcc}
          _i18n={i18n}
        />
      )}
    </View>
  );
}

function ProfileScreenLoader({
  account,
  link,
  _i18n,
}: {
  account: Account;
  link: DaimoLinkAccount | DaimoLinkInviteCode;
  _i18n: TranslationFunctions;
}) {
  console.log(`[ACCOUNT] loading account from link`, link);
  const daimoChain = daimoChainFromId(account.homeChainId);
  const status = useFetchLinkStatus(link, daimoChain)!;

  const nav = useNav();
  const i18n = _i18n.profile;
  useEffect(() => {
    if (status.data == null) return;

    // Get account, or inviter
    let eAcc: EAccount | undefined, inviterEAcc: EAccount | undefined;
    if ("account" in status.data) {
      eAcc = status.data.account;
      inviterEAcc = status.data.inviter;
    } else if ("inviter" in status.data) {
      eAcc = status.data.inviter || getTeamDaimoFaucetAcc();
    }

    if (eAcc == null) {
      if (nav.canGoBack()) nav.goBack();
      else nav.navigate("Home");
      return;
    }

    // Show account
    console.log(`[ACCOUNT] loaded account: ${JSON.stringify(status.data)}`);
    nav.navigate("Profile", { eAcc, inviterEAcc });
  }, [status.data]);

  assert(["account", "invite"].includes(link.type), "Bad link type");

  return (
    <View style={ss.container.padH16}>
      <View style={ss.container.center}>
        {status.isLoading && <ActivityIndicator size="large" />}
        {status.error && link.type === "account" && (
          <ErrorBanner
            error={status.error}
            displayTitle={i18n.error.account.title()}
            displayMessage={i18n.error.account.msg({
              account: link.account,
            })}
          />
        )}
        {status.error && link.type === "invite" && (
          <ErrorBanner
            error={status.error}
            displayTitle={i18n.error.invite.title()}
            displayMessage={i18n.error.invite.msg({
              code: link.code,
            })}
          />
        )}
      </View>
    </View>
  );
}

function getTeamDaimoFaucetAcc(): EAccount {
  return { addr: teamDaimoFaucetAddr, label: AddrLabel.Faucet };
}

function ProfileScreenBody({
  account,
  eAcc,
  inviterEAcc,
  _i18n,
}: {
  account: Account;
  eAcc: EAccount;
  inviterEAcc?: EAccount;
  _i18n: TranslationFunctions;
}) {
  const nav = useNav();
  const bottomSheetRef = useRef<SwipeUpDownRef>(null);

  const contact = addLastTransferTimes(account, eAcc);

  const canSend = canSendTo(eAcc);
  const goToSend = useCallback(() => {
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { recipient: contact },
    });
  }, [nav, eAcc, account]);
  const i18n = _i18n.profile;

  const canRequest = canRequestFrom(eAcc);
  const goToRequest = () => {
    nav.navigate("HomeTab", {
      screen: "Receive",
      params: { autoFocus: true, fulfiller: contact },
    });
  };

  // Bottom sheet: show transactions between us and this account
  const translationY = useSharedValue(0);
  const histListMini = (
    <HistoryListSwipe
      account={account}
      otherAcc={eAcc}
      showDate={false}
      maxToShow={5}
    />
  );
  const histListFull = (
    <HistoryListSwipe account={account} otherAcc={eAcc} showDate />
  );
  const { bottomSheet } = useSwipeUpDown({
    itemMini: histListMini,
    itemFull: histListFull,
    translationY,
    bottomSheetRef,
  });

  const onInviterPress = useCallback(() => {
    if (!inviterEAcc) return;
    navToAccountPage(inviterEAcc, nav);
  }, [inviterEAcc, nav]);

  // TODO: show other accounts coin+chain, once we support multiple.
  const subtitle = (() => {
    if (inviterEAcc)
      return (
        <TextBody color={color.gray3}>
          {i18n.subtitle.invitedBy()}
          <TextBody color={color.midnight} onPress={onInviterPress}>
            {getAccountName(inviterEAcc)}
          </TextBody>
        </TextBody>
      );
    else if (eAcc.timestamp)
      return (
        <TextBody color={color.gray3}>
          {i18n.subtitle.joined({ timeAgo: timeMonth(eAcc.timestamp) })}
        </TextBody>
      );
    else if (getAccountName(eAcc) !== getAddressContraction(eAcc.addr))
      return (
        <TextBody color={color.gray3}>
          {getAddressContraction(eAcc.addr)}
        </TextBody>
      );
    return null;
  })();

  // Show linked accounts
  const fcAccount = (eAcc.linkedAccounts || [])[0];

  return (
    <>
      <View style={styles.screenPadding}>
        <View style={styles.mainContent}>
          <ContactBubble contact={{ type: "eAcc", ...eAcc }} size={64} />
          <Spacer h={16} />
          <TextH2>{getAccountName(eAcc)}</TextH2>
          <Spacer h={4} />
          {subtitle}
          <Spacer h={4} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {fcAccount && <FarcasterButton fcAccount={fcAccount} />}
            {fcAccount && <Spacer w={8} />}
            <ExplorerBadge
              daimoChain={daimoChainFromId(account.homeChainId)}
              address={eAcc.addr}
            />
          </View>
        </View>
        <Spacer h={24} />
        <View style={[ss.container.padH8, styles.buttonGroup]}>
          {canRequest && (
            <View style={{ flex: 1 }}>
              <ButtonBig type="subtle" title="REQUEST" onPress={goToRequest} />
            </View>
          )}
          {canSend && (
            <View style={{ flex: 1 }}>
              <ButtonBig type="primary" title="SEND" onPress={goToSend} />
            </View>
          )}
        </View>
        <Spacer h={16} />
      </View>
      {bottomSheet}
    </>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flexDirection: "column",
    alignItems: "center",
  },
  noPadding: {
    paddingHorizontal: 0,
  },
  screenPadding: {
    paddingHorizontal: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 16,
  },
});
