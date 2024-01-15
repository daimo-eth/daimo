import {
  DaimoLinkAccount,
  EAccount,
  canSendTo,
  getAccountName,
  timeMonth,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { env } from "../../logic/env";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../model/account";
import { addLastSendTime } from "../../sync/recipients";
import { AccountBubble } from "../shared/AccountBubble";
import { AccountCopyLinkButton } from "../shared/AccountCopyLinkButton";
import { ButtonBig } from "../shared/Button";
import { HistoryListSwipe } from "../shared/HistoryList";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { ErrorRowCentered } from "../shared/error";
import {
  ParamListHome,
  useDisableTabSwipe,
  useExitBack,
  useExitToHome,
  useNav,
} from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextH3 } from "../shared/text";
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
    <View style={ss.container.screen}>
      <ScreenHeader title="Account" onBack={goBack || goHome} />
      <Spacer h={32} />
      {"link" in params && (
        <AccountScreenLoader account={props.account} link={params.link} />
      )}
      {"eAcc" in params && (
        <AccountScreenBody account={props.account} eAcc={params.eAcc} />
      )}
    </View>
  );
}

function AccountScreenLoader({
  account,
  link,
}: {
  account: Account;
  link: DaimoLinkAccount;
}) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  const status = useFetchLinkStatus(link, daimoChain)!;
  console.log(`[ACCOUNT] loading account from link: ${link.account}`);

  const nav = useNav();
  useEffect(() => {
    if (status.data == null) return;
    if (!("account" in status.data)) return;
    console.log(`[ACCOUNT] loaded account: ${JSON.stringify(status.data)}`);
    nav.navigate("HomeTab", {
      screen: "Account",
      params: { eAcc: status.data.account },
    });
  }, [status.data]);

  return (
    <View style={ss.container.center}>
      {status.isLoading && <ActivityIndicator size="large" />}
      {status.error && <ErrorRowCentered error={status.error} />}
    </View>
  );
}

function AccountScreenBody({
  account,
  eAcc,
}: {
  account: Account;
  eAcc: EAccount;
}) {
  const nav = useNav();
  useDisableTabSwipe(nav);

  const openExplorer = useCallback(() => {
    const { chainConfig } = env(daimoChainFromId(account.homeChainId));
    const explorer = chainConfig.chainL2.blockExplorers!.default;
    const url = `${explorer.url}/address/${eAcc.addr}`;
    Linking.openURL(url);
  }, [account, eAcc]);

  const canSend = canSendTo(eAcc);
  const send = useCallback(() => {
    const recipient = addLastSendTime(account, eAcc);
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { recipient, lagAutoFocus: true },
    });
  }, [nav, eAcc, account]);

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
  });

  // TODO: show other accounts coin+chain, once we support multiple.
  const subtitle = eAcc.timestamp
    ? `Joined ${timeMonth(eAcc.timestamp)}`
    : getAccountName({ addr: eAcc.addr });

  return (
    <>
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AccountBubble recipient={{ type: "account", ...eAcc }} size={64} />
        <Spacer h={16} />
        <AccountCopyLinkButton eAcc={eAcc} size="h2" center />
        <Spacer h={8} />
        <TextH3 color={color.gray3}>{subtitle}</TextH3>
      </View>
      <Spacer h={24} />
      <View style={ss.container.padH8}>
        {canSend && <ButtonBig type="primary" title="SEND" onPress={send} />}
      </View>
      <Spacer h={16} />
      <View style={ss.container.padH8}>
        <ButtonBig
          type="subtle"
          title="VIEW ON BLOCK EXPLORER"
          onPress={openExplorer}
        />
      </View>
      {bottomSheet}
    </>
  );
}
