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
  timeMonth,
} from "@daimo/common";
import { daimoChainFromId, teamDaimoFaucetAddr } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import {
  ParamListHome,
  navToAccountPage,
  useExitBack,
  useExitToHome,
  useNav,
} from "../../common/nav";
import { addLastTransferTimes } from "../../logic/daimoContacts";
import { env } from "../../logic/env";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../model/account";
import { AccountCopyLinkButton } from "../shared/AccountCopyLinkButton";
import { ButtonBig } from "../shared/Button";
import { ContactBubble } from "../shared/ContactBubble";
import { FarcasterButton } from "../shared/FarcasterBubble";
import { HistoryListSwipe } from "../shared/HistoryList";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { SwipeUpDownRef } from "../shared/SwipeUpDown";
import { ErrorBanner } from "../shared/error";
import { color, ss } from "../shared/style";
import { TextBody } from "../shared/text";
import { useSwipeUpDown } from "../shared/useSwipeUpDown";
import { useWithAccount } from "../shared/withAccount";

type Props = NativeStackScreenProps<ParamListHome, "Account">;

export function AccountScreen(props: Props) {
  const Inner = useWithAccount(AccountScreenInner);
  return <Inner {...props} />;
}

function AccountScreenInner(props: Props & { account: Account }) {
  const goBack = useExitBack();
  const goHome = useExitToHome();

  const { params } = props.route;

  return (
    <View style={[ss.container.screen, styles.noPadding]}>
      <View style={styles.screenPadding}>
        <ScreenHeader title="Account" onBack={goBack || goHome} />
      </View>
      <Spacer h={32} />
      {"link" in params && (
        <AccountScreenLoader account={props.account} link={params.link} />
      )}
      {"eAcc" in params && (
        <AccountScreenBody
          account={props.account}
          eAcc={params.eAcc}
          inviterEAcc={params.inviterEAcc}
        />
      )}
    </View>
  );
}

function AccountScreenLoader({
  account,
  link,
}: {
  account: Account;
  link: DaimoLinkAccount | DaimoLinkInviteCode;
}) {
  console.log(`[ACCOUNT] loading account from link`, link);
  const daimoChain = daimoChainFromId(account.homeChainId);
  const status = useFetchLinkStatus(link, daimoChain)!;

  const nav = useNav();
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
    nav.navigate("Account", { eAcc, inviterEAcc });
  }, [status.data]);

  assert(["account", "invite"].includes(link.type), "Bad link type");

  return (
    <View style={ss.container.padH16}>
      <View style={ss.container.center}>
        {status.isLoading && <ActivityIndicator size="large" />}
        {status.error && link.type === "account" && (
          <ErrorBanner
            error={status.error}
            displayTitle="Account not found"
            displayMessage={`Couldn't load account ${link.account}`}
          />
        )}
        {status.error && link.type === "invite" && (
          <ErrorBanner
            error={status.error}
            displayTitle="Invite not found"
            displayMessage={`Couldn't load invite ${link.code}`}
          />
        )}
      </View>
    </View>
  );
}

function getTeamDaimoFaucetAcc(): EAccount {
  return { addr: teamDaimoFaucetAddr, label: AddrLabel.Faucet };
}

function AccountScreenBody({
  account,
  eAcc,
  inviterEAcc,
}: {
  account: Account;
  eAcc: EAccount;
  inviterEAcc?: EAccount;
}) {
  const nav = useNav();
  const bottomSheetRef = useRef<SwipeUpDownRef>(null);

  const openExplorer = useCallback(() => {
    const { chainConfig } = env(daimoChainFromId(account.homeChainId));
    const explorer = chainConfig.chainL2.blockExplorers!.default;
    const url = `${explorer.url}/address/${eAcc.addr}`;
    Linking.openURL(url);
  }, [account, eAcc]);

  const canSend = canSendTo(eAcc);
  const canRequest = canRequestFrom(eAcc);
  const recipient = addLastTransferTimes(account, eAcc);

  const goToSend = useCallback(() => {
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { recipient },
    });
  }, [nav, eAcc, account]);

  const goToRequest = () => {
    nav.navigate("HomeTab", {
      screen: "Receive",
      params: { autoFocus: true, recipient },
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
          Invited by{" "}
          <TextBody color={color.midnight} onPress={onInviterPress}>
            {getAccountName(inviterEAcc)}
          </TextBody>
        </TextBody>
      );
    else if (eAcc.timestamp)
      return (
        <TextBody color={color.gray3}>
          Joined {timeMonth(eAcc.timestamp)}
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
          <AccountCopyLinkButton eAcc={eAcc} size="h2" center />
          <Spacer h={4} />
          {subtitle}
          {fcAccount && (
            <>
              <FarcasterButton fcAccount={fcAccount} />
            </>
          )}
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
        <View style={ss.container.padH8}>
          <ButtonBig
            type="subtle"
            title="VIEW ON BLOCK EXPLORER"
            onPress={openExplorer}
          />
        </View>
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
