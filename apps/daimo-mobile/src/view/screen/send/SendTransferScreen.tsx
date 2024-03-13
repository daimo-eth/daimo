import {
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assertNotNull,
  getAccountName,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { FulfillRequestButton } from "./FulfillRequestButton";
import { RecipientDisplay } from "./RecipientDisplay";
import { SendTransferButton } from "./SendTransferButton";
import {
  ParamListSend,
  SendNavProp,
  useExitToHome,
  useNav,
} from "../../../common/nav";
import {
  EAccountContact,
  addLastSendRecvTime,
  getContactName,
} from "../../../logic/daimoContacts";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { Account } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { CenterSpinner } from "../../shared/CenterSpinner";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { ss } from "../../shared/style";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListSend, "SendTransfer">;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const Inner = useWithAccount(SendScreenInner);
  return <Inner {...route.params} />;
}

function SendScreenInner({
  link,
  recipient,
  dollars,
  account,
}: SendNavProp & { account: Account }) {
  assertNotNull(link || recipient, "SendScreenInner: need link or recipient");

  const daimoChain = daimoChainFromId(account.homeChainId);
  const requestFetch = useFetchLinkStatus(link, daimoChain);
  const requestStatus = requestFetch.data as
    | DaimoRequestStatus
    | DaimoRequestV2Status
    | null;

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    const goTo = (params: Props["route"]["params"]) =>
      nav.navigate("SendTab", { screen: "SendTransfer", params });
    if (dollars != null) goTo({ recipient });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, dollars, recipient]);

  const sendDisplay = (() => {
    if (link) {
      if (requestFetch.isFetching) return <CenterSpinner />;
      else if (requestFetch.error)
        return <ErrorRowCentered error={requestFetch.error} />;
      else if (requestStatus) {
        const recipient = addLastSendRecvTime(account, requestStatus.recipient);
        if (requestStatus.link.type === "requestv2") {
          return (
            <SendConfirm
              account={account}
              recipient={recipient}
              dollars={requestStatus.link.dollars}
              requestStatus={requestStatus as DaimoRequestV2Status}
            />
          );
        } else {
          // Backcompat with old request links
          return (
            <SendConfirm
              account={account}
              recipient={recipient}
              dollars={requestStatus.link.dollars}
            />
          );
        }
      } else return <CenterSpinner />;
    } else if (recipient) {
      if (dollars == null)
        return <SendChooseAmount recipient={recipient} onCancel={goBack} />;
      else return <SendConfirm {...{ account, recipient, dollars }} />;
    } else throw new Error("unreachable");
  })();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send to" onBack={goBack} onExit={goHome} />
        <Spacer h={8} />
        {sendDisplay}
      </View>
    </TouchableWithoutFeedback>
  );
}

function SendChooseAmount({
  recipient,
  onCancel,
}: {
  recipient: EAccountContact;
  onCancel: () => void;
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
        title={`First time paying ${getContactName(recipient)}`}
        subtitle="Ensure the recipient is correct"
      />
    );
  }
  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  return (
    <View>
      {infoBubble}
      <Spacer h={32} />
      <RecipientDisplay recipient={recipient} />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        dollars={dollars}
        onSetDollars={setDollars}
        showAmountAvailable
        autoFocus
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
  account,
  recipient,
  dollars,
  requestStatus,
}: {
  account: Account;
  recipient: EAccountContact;
  dollars: `${number}`;
  requestStatus?: DaimoRequestV2Status;
}) {
  const nDollars = parseFloat(dollars);
  const isRequest = !!requestStatus;

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

  const button = (() => {
    if (isRequest)
      return <FulfillRequestButton {...{ account, requestStatus }} />;
    else
      return (
        <SendTransferButton {...{ account, recipient, dollars: nDollars }} />
      );
  })();
  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  return (
    <View>
      {infoBubble}
      <Spacer h={32} />
      <RecipientDisplay
        recipient={recipient}
        isRequest={isRequest}
        requestMemo={requestStatus?.link?.memo}
      />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        dollars={nDollars}
        onSetDollars={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        onFocus={onFocus}
      />
      <Spacer h={32} />
      {button}
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
