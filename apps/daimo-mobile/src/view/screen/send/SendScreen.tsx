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
import { assert } from "../../../logic/assert";
import { amountToDollars, dollarsToAmount } from "../../../logic/coin";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { useAccount } from "../../../model/account";
import { OpStatus } from "../../../model/op";
import { Recipient } from "../../../sync/loadRecipients";
import { TitleAmount } from "../../shared/Amount";
import { ButtonBig, ButtonSmall } from "../../shared/Button";
import { Header } from "../../shared/Header";
import { AmountInput } from "../../shared/Input";
import Spacer from "../../shared/Spacer";
import { cacheName, getNameOrAddr } from "../../shared/addr";
import { HomeStackParamList, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextError, TextH2, TextSmall } from "../../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Send">;

type SendTab = "search" | "scan" | "createNote";

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
      <ScrollView contentContainerStyle={styles.vertMain} bounces={false}>
        {recipient && (
          <SetAmount recipient={recipient} dollars={dollars || 0} />
        )}
        {!recipient && (
          <>
            {tab !== "createNote" && (
              <SegmentedControl
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
          <ButtonBig title="Create Note" onPress={createNote} />
          <Spacer h={16} />
          <TextSmall>
            <TextCenter>{sendViaAppStr}</TextCenter>
          </TextSmall>
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
  const disp = getNameOrAddr(recipient);

  // Temporary dollar amount while typing
  const [d, setD] = useState(0);
  const submit = () => {
    nav.setParams({ dollars: d });
    setD(0);
  };

  // Show how much we have available
  const [account] = useAccount();
  if (account == null) return null;
  const bal = amountToDollars(account.lastBalance);

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
          <AmountInput value={d} onChange={setD} onSubmitEditing={submit} />
          <Spacer h={16} />
          <TextSmall>
            <TextCenter>${bal} available</TextCenter>
          </TextSmall>
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

  // TODO: do this elsewhere
  useEffect(() => {
    if (recipient.name == null) return;
    cacheName(recipient.addr, recipient.name);
  }, [recipient]);

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
    }
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
            title={`Send to ${getNameOrAddr(recipient)}`}
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
      <TextSmall>
        <TextCenter>{statusMessage}</TextCenter>
      </TextSmall>
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
