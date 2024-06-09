import {
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assert,
  assertNotNull,
  getAccountName,
  now,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { FulfillRequestButton } from "./FulfillRequestButton";
import { MemoPellet, SendMemoButton } from "./MemoDisplay";
import { SendTransferButton } from "./SendTransferButton";
import {
  ParamListSend,
  SendNavProp,
  useExitToHome,
  useNav,
} from "../../../common/nav";
import { getAccountManager } from "../../../logic/accountManager";
import {
  EAccountContact,
  addLastTransferTimes,
  getContactName,
} from "../../../logic/daimoContacts";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { getRpcFunc, getRpcHook } from "../../../logic/trpc";
import { Account } from "../../../model/account";
import { MoneyEntry, usdEntry, zeroUSDEntry } from "../../../model/moneyEntry";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig, TextButton } from "../../shared/Button";
import { CenterSpinner } from "../../shared/CenterSpinner";
import { ContactDisplay } from "../../shared/ContactDisplay";
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
  money,
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
    if (money != null) goTo({ recipient });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, money, recipient]);

  const sendDisplay = (() => {
    if (link) {
      if (requestFetch.isFetching) {
        return <CenterSpinner />;
      } else if (requestFetch.error) {
        return <ErrorRowCentered error={requestFetch.error} />;
      } else if (requestStatus) {
        const recipient = addLastTransferTimes(
          account,
          requestStatus.recipient
        );
        if (requestStatus.link.type === "requestv2") {
          const statusV2 = requestStatus as DaimoRequestV2Status;
          return (
            <SendConfirm
              account={account}
              recipient={recipient}
              memo={memo || statusV2.memo}
              money={usdEntry(requestStatus.link.dollars)}
              requestStatus={statusV2}
            />
          );
        } else {
          // Backcompat with old request links
          return (
            <SendConfirm
              account={account}
              recipient={recipient}
              memo={memo}
              money={usdEntry(requestStatus.link.dollars)}
            />
          );
        }
      } else return <CenterSpinner />;
    } else if (recipient) {
      if (money == null)
        return (
          <SendChooseAmount
            recipient={recipient}
            onCancel={goBack}
            daimoChain={daimoChain}
          />
        );
      else return <SendConfirm {...{ account, recipient, memo, money }} />;
    } else throw new Error("unreachable");
  })();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
  const [money, setMoney] = useState(zeroUSDEntry);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(undefined);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { money, memo, recipient },
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
  const rpcHook = getRpcHook(daimoChain);
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  return (
    <View>
      {infoBubble}
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={setMoney}
        showAmountAvailable
        autoFocus
      />
      <Spacer h={16} />
      <SendMemoButton memo={memo} memoStatus={memoStatus} setMemo={setMemo} />
      <Spacer h={16} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonGrow}>
          <ButtonBig type="subtle" title="CANCEL" onPress={onCancel} />
        </View>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="primary"
            title="CONFIRM"
            onPress={setSendAmount}
            disabled={
              money.dollars === 0 || (memoStatus && memoStatus !== "ok")
            }
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
      <TextLight>Payments are public</TextLight>
    </TextCenter>
  );
}

function SendConfirm({
  account,
  recipient,
  money,
  memo,
  requestStatus,
}: {
  account: Account;
  recipient: EAccountContact;
  money: MoneyEntry;
  memo: string | undefined;
  requestStatus?: DaimoRequestV2Status;
}) {
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

  let button: ReactNode;
  if (isRequest) {
    button = <FulfillRequestButton {...{ account, requestStatus }} />;
  } else {
    const memoParts = [] as string[];
    if (money.currency.currency !== "USD") {
      memoParts.push(`${money.currency.symbol}${money.localUnits}`);
    }
    if (memo != null) {
      memoParts.push(memo);
    }
    button = (
      <SendTransferButton
        account={account}
        memo={memoParts.join(" · ")}
        recipient={recipient}
        dollars={money.dollars}
      />
    );
  }

  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  const rpcFunc = getRpcFunc(daimoChainFromId(account!.homeChainId));

  const [isDecliningRequest, setIsDecliningRequest] = useState(false);

  const onDecline = async () => {
    assert(requestStatus != null);

    await rpcFunc.declineRequest.mutate({
      requestId: requestStatus.link.id,
      decliner: account.address,
    });

    getAccountManager().transform((acc) => {
      const updatedRequestStatus = {
        ...requestStatus,
        status: DaimoRequestState.Declined,
        updatedAt: now(),
      };
      return {
        ...acc,
        // Replace old request with updated one
        notificationRequestStatuses: acc.notificationRequestStatuses
          .filter((r) => r.link.id !== requestStatus.link.id)
          .concat([updatedRequestStatus]),
      };
    });

    nav.navigate("Home");
  };

  return (
    <View>
      {infoBubble}
      <Spacer h={24} />
      <ContactDisplay
        contact={recipient}
        isRequest={isRequest}
        requestMemo={requestStatus?.link?.memo}
      />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        onFocus={navToInput}
      />
      <Spacer h={16} />
      {memo ? (
        <MemoPellet memo={memo} onClick={navToInput} />
      ) : (
        <Spacer h={40} />
      )}
      <Spacer h={16} />
      {button}
      {isRequest && (
        <>
          <Spacer h={16} />
          {isDecliningRequest ? (
            <ActivityIndicator size="large" />
          ) : (
            <TextButton
              title="DECLINE"
              onPress={async () => {
                setIsDecliningRequest(true);
                await onDecline();
              }}
            />
          )}
        </>
      )}
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
