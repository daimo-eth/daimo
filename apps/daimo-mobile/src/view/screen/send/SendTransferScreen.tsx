import {
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assertNotNull,
  getAccountName,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { FulfillRequestButton } from "./FulfillRequestButton";
import { SendMemoButton, MemoPellet } from "./MemoDisplay";
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
  addLastTransferTimes,
  getContactName,
} from "../../../logic/daimoContacts";
import { env } from "../../../logic/env";
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
import { TextCenter, TextLight } from "../../shared/text";
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
  memo,
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
        const recipient = addLastTransferTimes(
          account,
          requestStatus.recipient
        );
        if (requestStatus.link.type === "requestv2") {
          return (
            <SendConfirm
              account={account}
              recipient={recipient}
              memo={memo}
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
              memo={memo}
              dollars={requestStatus.link.dollars}
            />
          );
        }
      } else return <CenterSpinner />;
    } else if (recipient) {
      if (dollars == null)
        return (
          <SendChooseAmount
            recipient={recipient}
            onCancel={goBack}
            daimoChain={daimoChain}
          />
        );
      else return <SendConfirm {...{ account, recipient, memo, dollars }} />;
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
  daimoChain,
  onCancel,
}: {
  recipient: EAccountContact;
  daimoChain: DaimoChain;
  onCancel: () => void;
}) {
  // Select how much
  const [dollars, setDollars] = useState(0);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(undefined);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { dollars: `${dollars}`, memo, recipient },
    });

  // Warn if paying new account
  let infoBubble = <Spacer h={16} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBox title={`First time paying ${getContactName(recipient)}`} />
    );
  }
  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  // Validate memo
  const rpcHook = env(daimoChain).rpcHook;
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  return (
    <View>
      {infoBubble}
      <Spacer h={24} />
      <RecipientDisplay recipient={recipient} />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        dollars={dollars}
        onSetDollars={setDollars}
        showAmountAvailable
        autoFocus
      />
      <Spacer h={16} />
      <SendMemoButton
        memo={memo}
        memoStatus={memoStatus}
        setMemo={setMemo}
        daimoChain={daimoChain}
      />
      <Spacer h={16} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonGrow}>
          <ButtonBig type="subtle" title="Cancel" onPress={onCancel} />
        </View>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="primary"
            title="Send"
            onPress={setSendAmount}
            disabled={dollars === 0 || (memoStatus && memoStatus !== "ok")}
          />
        </View>
      </View>
      <Spacer h={14} />
      <PublicWarning />
    </View>
  );
}

function PublicWarning() {
  return (
    <TextCenter>
      <TextLight>All payment details are public</TextLight>
    </TextCenter>
  );
}

function SendConfirm({
  account,
  recipient,
  dollars,
  memo,
  requestStatus,
}: {
  account: Account;
  recipient: EAccountContact;
  dollars: `${number}`;
  memo: string | undefined;
  requestStatus?: DaimoRequestV2Status;
}) {
  const nDollars = parseFloat(dollars);
  const isRequest = !!requestStatus;

  // Warn if paying new account
  let infoBubble = <Spacer h={16} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBox title={`First time paying ${getAccountName(recipient)}`} />
    );
  }

  const nav = useNav();

  const navToInput = () => {
    nav.navigate("SendTab", { screen: "SendTransfer", params: { recipient } });
  };

  const button = (() => {
    if (isRequest)
      return <FulfillRequestButton {...{ account, requestStatus }} />;
    else
      return (
        <SendTransferButton
          {...{ account, memo, recipient, dollars: nDollars }}
        />
      );
  })();
  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  return (
    <View>
      {infoBubble}
      <Spacer h={24} />
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
        onFocus={navToInput}
      />
      <Spacer h={16} />
      {memo ? (
        <MemoPellet memo={memo} onClick={navToInput} />
      ) : (
        <Spacer h={38} />
      )}
      <Spacer h={16} />
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
