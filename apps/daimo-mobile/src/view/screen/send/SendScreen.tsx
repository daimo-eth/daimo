import {
  DaimoAccountStatus,
  DaimoRequestStatus,
  EAccount,
  OpStatus,
  assert,
  dollarsToAmount,
  getAccountName,
} from "@daimo/common";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ScanTab } from "./ScanTab";
import { SearchTab } from "./SearchTab";
import { SendNoteButton } from "./SendNoteButton";
import { useSendAsync } from "../../../action/useSendAsync";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { useAccount } from "../../../model/account";
import { Recipient } from "../../../sync/recipients";
import { getAmountText } from "../../shared/Amount";
import { SendAmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { Header } from "../../shared/Header";
import Spacer from "../../shared/Spacer";
import { HomeStackParamList, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextError, TextH2 } from "../../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Send">;

type SendTab = "search" | "scan" | "createNote";

// TODO: remove after upgrading react/expo to fix typescript error
const SegmentedControlFixed = SegmentedControl as any;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const { link } = route.params || {};
  const linkStatus = useFetchLinkStatus(link);

  const { recipient, dollars, requestId } = useMemo(() => {
    if (
      !linkStatus ||
      linkStatus.isFetching ||
      linkStatus.error ||
      linkStatus.data == null
    )
      return {};
    if (linkStatus.data.link.type === "account") {
      const status = linkStatus.data as DaimoAccountStatus;
      return {
        recipient: status.account,
        dollars: undefined,
        requestId: undefined,
      };
    } else {
      assert(linkStatus.data.link.type === "request");
      const status = linkStatus.data as DaimoRequestStatus;
      return {
        recipient: status.recipient,
        dollars: parseFloat(status.link.dollars),
        requestId: status.requestId,
      };
    }
  }, [linkStatus]);

  // Navigation
  const [tab, setTab] = useState<SendTab>("search");
  const [tabs] = useState(["Search", "Scan"]);
  const setSegmentVal = (v: string) => setTab(v === "Scan" ? "scan" : "search");
  const createNote = useCallback(() => setTab("createNote"), []);
  const search = useCallback(() => setTab("search"), []);

  // Create Note shows available secure messaging apps
  const [, sendViaAppStr] = useAvailMessagingApps();
  const [noteDollars, setNoteDollars] = useState(0);
  const [noteCreated, setNoteCreated] = useState(false);
  const onNoteCreated = useCallback(() => setNoteCreated(true), []);

  return (
    <View style={ss.container.fullWidthSinglePage}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.vertStretch}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={128}>
          {recipient && (
            <SetAmount recipient={recipient} dollars={dollars || 0} />
          )}
          {!recipient && (
            <>
              {tab !== "createNote" && (
                <SegmentedControlFixed
                  values={tabs}
                  selectedIndex={tab === "scan" ? 1 : 0}
                  onValueChange={setSegmentVal}
                  fontStyle={{ fontSize: 16 }}
                  activeFontStyle={{ fontSize: 16 }}
                  style={{ height: 40 }}
                />
              )}
              {tab !== "createNote" && <Spacer h={16} />}
              {tab === "search" && <SearchTab />}
              {tab === "scan" && <ScanTab hide={search} />}
              {tab === "createNote" && (
                <SendAmountChooser
                  actionDesc={
                    noteCreated
                      ? "Payment link created"
                      : "Creating payment link"
                  }
                  dollars={noteDollars}
                  onSetDollars={noteCreated ? undefined : setNoteDollars}
                  onCancel={noteCreated ? undefined : search}
                />
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </ScrollView>
      {!recipient && tab === "search" && (
        <ButtonWithStatus
          button={
            <ButtonBig
              type="primary"
              title="Create Payment Link"
              onPress={createNote}
            />
          }
          status={sendViaAppStr}
        />
      )}
      {!recipient && tab === "createNote" && (
        <SendNoteButton dollars={noteDollars} onCreated={onNoteCreated} />
      )}
      {recipient && (
        <SendButton
          recipient={recipient}
          dollars={dollars || 0}
          requestId={requestId}
        />
      )}
    </View>
  );
}

function SetAmount({
  recipient,
  dollars,
}: {
  recipient: Recipient;
  dollars: number;
}) {
  // Show who we're sending to
  const disp = getAccountName(recipient);

  // Show how much
  const nav = useNav();
  const hide = () =>
    nav.setParams({ recipient: undefined, dollars: undefined });
  const setDollars = (newD: number) =>
    nav.setParams({ dollars: newD > 0 ? newD : undefined });

  const actionDesc = (
    <TextCenter>
      Sending to{"\n"}
      <TextH2>{disp}</TextH2>
    </TextCenter>
  );

  return (
    <SendAmountChooser
      actionDesc={actionDesc}
      onCancel={hide}
      dollars={dollars}
      onSetDollars={setDollars}
    />
  );
}

function SendButton({
  recipient,
  dollars,
  requestId,
}: {
  recipient: Recipient;
  dollars: number;
  requestId?: `${bigint}`;
}) {
  console.log(`[SEND] rendering SendButton ${dollars} ${requestId}`);
  const [account] = useAccount();
  assert(account != null);
  assert(dollars >= 0);

  const nonceMetadata = requestId
    ? new DaimoNonceMetadata(DaimoNonceType.RequestResponse, BigInt(requestId))
    : new DaimoNonceMetadata(DaimoNonceType.Send);

  const nonce = useMemo(() => new DaimoNonce(nonceMetadata), [requestId]);

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      assert(dollars > 0);
      console.log(`[ACTION] sending $${dollars} to ${recipient.addr}`);
      return opSender.erc20transfer(recipient.addr, `${dollars}`, {
        nonce,
        chainGasConstants: account.chainGasConstants,
      });
    },
    pendingOp: {
      type: "transfer",
      from: account.address,
      to: recipient.addr,
      amount: Number(dollarsToAmount(dollars)),
      status: OpStatus.pending,
      timestamp: 0,
      nonceMetadata: nonceMetadata.toHex(),
    },
    namedAccounts: recipient.name ? [recipient as EAccount] : [],
  });

  const sendDisabledReason =
    account.lastBalance < dollarsToAmount(cost.totalDollars)
      ? "Insufficient funds"
      : undefined;
  const disabled = sendDisabledReason != null || dollars === 0;

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <ButtonBig
            title={`Send to ${getAccountName(recipient)}`}
            onPress={disabled ? undefined : exec}
            type="primary"
            disabled={disabled}
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return null;
    }
  })();

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (sendDisabledReason != null)
          return <TextError>{sendDisabledReason}</TextError>;
        if (dollars === 0) return null;
        return `Total incl. fees ${getAmountText({
          dollars: cost.totalDollars,
        })}`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  // On success, go home, show newly created transaction
  const nav = useNav();
  useEffect(() => {
    if (status !== "success") return;
    nav.navigate("Home");
  }, [status]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}

const styles = StyleSheet.create({
  vertStretch: {
    flexDirection: "column",
    alignSelf: "stretch",
  },
});
