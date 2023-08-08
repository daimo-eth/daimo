import {
  EAccount,
  OpStatus,
  assert,
  dollarsToAmount,
  getAccountName,
} from "@daimo/common";
import { DaimoAccount } from "@daimo/userop";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { CancelHeader } from "./CancelHeader";
import { CreateNoteTab } from "./CreateNoteTab";
import { ScanTab } from "./ScanTab";
import { SearchTab } from "./SearchTab";
import { useSendAsync } from "../../../action/useSendAsync";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { useAccount } from "../../../model/account";
import { Recipient } from "../../../sync/recipients";
import { TitleAmount, getAmountText } from "../../shared/Amount";
import { ButtonBig, ButtonSmall } from "../../shared/Button";
import { Header } from "../../shared/Header";
import { AmountInput } from "../../shared/Input";
import Spacer from "../../shared/Spacer";
import { HomeStackParamList, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextError, TextH2, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Send">;

type SendTab = "search" | "scan" | "createNote";

// TODO: remove after upgrading react/expo to fix typescript error
const SegmentedControlFixed = SegmentedControl as any;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const { recipient, dollars } = route.params || {};

  // Navigation
  const [tab, setTab] = useState<SendTab>("search");
  const [tabs] = useState(["Search", "Scan"]);
  const setSegmentVal = (v: string) => setTab(v === "Scan" ? "scan" : "search");
  const createNote = useCallback(() => setTab("createNote"), []);
  const search = useCallback(() => setTab("search"), []);

  // Create Note shows available secure messaging apps
  const [, sendViaAppStr] = useAvailMessagingApps();

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.vertMain}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
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
            {tab === "createNote" && <CreateNoteTab hide={search} />}
          </>
        )}
      </ScrollView>
      {!recipient && tab === "search" && (
        <View style={ss.container.ph16}>
          <ButtonBig type="primary" title="Create Note" onPress={createNote} />
          <Spacer h={16} />
          <TextLight>
            <TextCenter>{sendViaAppStr}</TextCenter>
          </TextLight>
        </View>
      )}
      {recipient && <SendButton recipient={recipient} dollars={dollars || 0} />}
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
  const nav = useNav();
  const hide = () =>
    nav.setParams({ recipient: undefined, dollars: undefined });
  const clearDollars = () => nav.setParams({ dollars: undefined });

  // Show who we're sending to
  const disp = getAccountName(recipient);

  // Temporary dollar amount while typing
  const [d, setD] = useState(0);
  const submit = (newD: number) => {
    nav.setParams({ dollars: newD });
    setD(0);
  };

  // Show how much we have available
  const [account] = useAccount();
  if (account == null) return null;
  const dollarStr = getAmountText({ amount: account.lastBalance });

  console.log(`WTF sendscreen render ${d}`);

  return (
    <>
      <Spacer h={64} />
      <CancelHeader hide={hide}>
        <TextCenter>
          Sending to{"\n"}
          <TextH2>{disp}</TextH2>
        </TextCenter>
      </CancelHeader>
      <Spacer h={32} />
      {dollars === 0 && (
        <View style={ss.container.ph16}>
          <AmountInput dollars={d} onChange={setD} onSubmitEditing={submit} />
          <Spacer h={16} />
          <TextLight>
            <TextCenter>{dollarStr} available</TextCenter>
          </TextLight>
        </View>
      )}
      {dollars > 0 && (
        <ButtonSmall onPress={clearDollars}>
          <TextCenter>
            <TitleAmount amount={dollarsToAmount(dollars)} />
          </TextCenter>
        </ButtonSmall>
      )}
    </>
  );
}

function SendButton({
  recipient,
  dollars,
}: {
  recipient: Recipient;
  dollars: number;
}) {
  const [account] = useAccount();
  assert(account != null);
  assert(dollars >= 0);

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    async (account: DaimoAccount) => {
      assert(dollars > 0);
      console.log(`[ACTION] sending $${dollars} to ${recipient.addr}`);
      return account.erc20transfer(recipient.addr, `${dollars}`);
    },
    {
      type: "transfer",
      from: account.address,
      to: recipient.addr,
      amount: Number(dollarsToAmount(dollars)),
      status: OpStatus.pending,
      timestamp: 0,
    },
    recipient.name ? [recipient as EAccount] : []
  );

  // TODO: load estimated fees
  const fees = 0.05;
  const totalDollars = dollars + fees;

  const sendDisabledReason =
    account.lastBalance < dollarsToAmount(totalDollars)
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
        return `Total incl. fees $${totalDollars.toFixed(2)}`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  // On success, redirect to plain Send page
  const nav = useNav();
  useEffect(() => {
    if (status !== "success") return;

    // Go Home, show newly created transaction
    nav.navigate("Home");
  }, [status]);

  return (
    <View style={ss.container.ph16}>
      {button}
      <Spacer h={16} />
      <TextLight>
        <TextCenter>{statusMessage}</TextCenter>
      </TextLight>
    </View>
  );
}

const styles = StyleSheet.create({
  vertMain: {
    flexDirection: "column",
    alignSelf: "stretch",
    paddingTop: 8,
  },
});
