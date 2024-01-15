import {
  DaimoAccountStatus,
  DaimoLink,
  DaimoRequestStatus,
  getAccountName,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { RecipientDisplay } from "./RecipientDisplay";
import { SendTransferButton } from "./SendTransferButton";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { Account } from "../../../model/account";
import {
  AccountRecipient,
  addLastSendTime,
  getRecipientName,
} from "../../../sync/recipients";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import {
  ParamListSend,
  useDisableTabSwipe,
  useExitToHome,
  useNav,
} from "../../shared/nav";
import { ss } from "../../shared/style";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListSend, "SendTransfer">;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const { link, recipient, dollars, requestId, lagAutoFocus } =
    route.params || {};

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    const goTo = (params: Props["route"]["params"]) =>
      nav.navigate("SendTab", { screen: "SendTransfer", params });
    if (dollars != null) goTo({ recipient });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, dollars, recipient]);

  useDisableTabSwipe(nav);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send to" onBack={goBack} onExit={goHome} />
        <Spacer h={8} />
        {!recipient && link && <SendLoadRecipient {...{ link }} />}
        {recipient && dollars == null && (
          <SendChooseAmount
            recipient={recipient}
            onCancel={goBack}
            lagAutoFocus={lagAutoFocus}
          />
        )}
        {recipient && dollars != null && (
          <SendConfirm {...{ recipient, dollars, requestId }} />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function SendLoadRecipient({ link }: { link: DaimoLink }) {
  const Inner = useWithAccount(SendLoadRecipientInner);
  return <Inner link={link} />;
}

function SendLoadRecipientInner({
  account,
  link,
}: {
  account: Account;
  link: DaimoLink;
}) {
  const nav = useNav();

  const status = useFetchLinkStatus(
    link,
    daimoChainFromId(account.homeChainId)
  )!;
  useEffect(() => {
    if (status.data == null) return;
    const { data } = status;
    switch (data.link.type) {
      case "account": {
        const { account: recipientEAcc } = data as DaimoAccountStatus;
        const recipient = addLastSendTime(account, recipientEAcc);
        nav.navigate("SendTab", {
          screen: "SendTransfer",
          params: { recipient },
        });
        break;
      }
      case "request": {
        // TODO: handle fulfilledBy (request already completed)
        const { recipient: recipientEAcc, requestId } =
          data as DaimoRequestStatus;
        const recipient = addLastSendTime(account, recipientEAcc);
        const { dollars } = data.link;
        nav.navigate("SendTab", {
          screen: "SendTransfer",
          params: { recipient, requestId, dollars },
        });
        break;
      }
    }
  }, [status]);

  return (
    <View style={ss.container.center}>
      {status.isLoading && <ActivityIndicator size="large" />}
      {status.error && <ErrorRowCentered error={status.error} />}
    </View>
  );
}

function SendChooseAmount({
  recipient,
  onCancel,
  lagAutoFocus,
}: {
  recipient: AccountRecipient;
  onCancel: () => void;
  lagAutoFocus?: boolean;
}) {
  // Select how much
  const [dollars, setDollars] = useState(0);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { dollars: `${dollars}`, recipient },
    });

  // Warn if paying new account
  let infoBubble = <Spacer h={32} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBox
        title={`First time paying ${getRecipientName(recipient)}`}
        subtitle="Ensure the recipient is correct"
      />
    );
  }

  return (
    <View>
      <Spacer h={8} />
      {infoBubble}
      <Spacer h={32} />
      <RecipientDisplay recipient={recipient} />
      <Spacer h={24} />
      <AmountChooser
        dollars={dollars}
        onSetDollars={setDollars}
        showAmountAvailable
        autoFocus
        lagAutoFocus={lagAutoFocus ?? false}
      />
      <Spacer h={32} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonGrow}>
          <ButtonBig type="subtle" title="Cancel" onPress={onCancel} />
        </View>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="primary"
            title="Send"
            onPress={setSendAmount}
            disabled={dollars === 0}
          />
        </View>
      </View>
    </View>
  );
}

function SendConfirm({
  recipient,
  dollars,
  requestId,
}: {
  recipient: AccountRecipient;
  dollars: `${number}`;
  requestId?: `${bigint}`;
}) {
  const nDollars = parseFloat(dollars);
  const isRequest = requestId != null;

  // Warn if paying new account
  let infoBubble = <Spacer h={32} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBox
        title={`First time paying ${getAccountName(recipient)}`}
        subtitle="Ensure the recipient is correct"
      />
    );
  }

  const nav = useNav();

  const onFocus = () => {
    nav.navigate("SendTab", { screen: "SendTransfer", params: { recipient } });
  };

  return (
    <View>
      <Spacer h={8} />
      {infoBubble}
      <Spacer h={32} />
      <RecipientDisplay {...{ recipient, isRequest }} />
      <Spacer h={24} />
      <AmountChooser
        dollars={nDollars}
        onSetDollars={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        lagAutoFocus={false}
        onFocus={onFocus}
      />
      <Spacer h={32} />
      <SendTransferButton {...{ recipient, dollars: nDollars, requestId }} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    gap: 18,
    marginHorizontal: 8,
  },
  buttonGrow: {
    flex: 1,
  },
});
