import { tokenMetadata } from "@daimo/contract";
import { DaimoAccount } from "@daimo/userop";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { ReactNode, useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { parseUnits } from "viem";

import { CancelHeader } from "./CancelHeader";
import { CreateNoteTab } from "./CreateNodeTab";
import { ScanTab } from "./ScanTab";
import { SearchTab } from "./SearchTab";
import { useSendAsync } from "../../../action/useSendAsync";
import { assert } from "../../../logic/assert";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { Recipient } from "../../../logic/recipient";
import { useAccount } from "../../../model/account";
import { TitleAmount } from "../../shared/Amount";
import { ButtonBig, ButtonSmall } from "../../shared/Button";
import { Header } from "../../shared/Header";
import { AmountInput } from "../../shared/Input";
import { HomeStackParamList, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextError, TextH2, TextSmall } from "../../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Send">;

type SendTab = "search" | "scan" | "createNote";

export default function SendScreen({ route }: Props) {
  const { recipient, dollars } = route.params || {};

  const [tab, setTab] = useState<SendTab>("search");
  const [tabs] = useState(["Search", "Scan"]);
  const createNote = useCallback(() => setTab("createNote"), []);
  const search = useCallback(() => setTab("search"), []);
  const setSegmentVal = useCallback(
    (v: string) => setTab(v.toLowerCase() as SendTab),
    []
  );

  const [, sendViaAppStr] = useAvailMessagingApps();

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <ScrollView contentContainerStyle={styles.vertMain} bounces={false}>
        {recipient && <SetAmount recipient={recipient} dollars={dollars} />}
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
            {tab !== "createNote" && <View style={ss.spacer.h16} />}
            {tab === "search" && <SearchTab />}
            {tab === "scan" && <ScanTab hide={search} />}
            {tab === "createNote" && <CreateNoteTab hide={search} />}
          </>
        )}
      </ScrollView>
      {!recipient && tab === "search" && (
        <View style={ss.container.ph16}>
          <ButtonBig title="Create Note" onPress={createNote} />
          <View style={ss.spacer.h16} />
          <TextSmall>{sendViaAppStr}</TextSmall>
        </View>
      )}
      {recipient && dollars && (
        <SendButton recipient={recipient} dollars={dollars} />
      )}
    </View>
  );
}

function SetAmount({
  recipient,
  dollars,
}: {
  recipient: Recipient;
  dollars?: number;
}) {
  const nav = useNav();
  const hide = () =>
    nav.setParams({ recipient: undefined, dollars: undefined });
  const clearDollars = () => nav.setParams({ dollars: undefined });

  // Temporary dollar amount while typing
  const [d, setD] = useState(0);
  const submit = () => {
    nav.setParams({ dollars: d });
    setD(0);
  };

  // Exact amount in token units
  const amount = parseUnits(`${dollars || 0}`, tokenMetadata.decimals);

  return (
    <>
      <View style={ss.spacer.h128} />
      <CancelHeader hide={hide}>
        <TextCenter>
          Sending to{"\n"}
          <TextH2>{recipient.name}</TextH2>
        </TextCenter>
      </CancelHeader>
      <View style={ss.spacer.h32} />
      {dollars == null && (
        <View style={ss.container.ph16}>
          <AmountInput value={d} onChange={setD} onSubmitEditing={submit} />
        </View>
      )}
      {dollars != null && (
        <ButtonSmall onPress={clearDollars}>
          <TextCenter>
            <TitleAmount amount={amount} />
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

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    async (account: DaimoAccount) => {
      console.log(`[ACTION] sending $${dollars} to ${recipient.addr}`);
      return account.erc20transfer(recipient.addr, `${dollars}`);
    }
  );

  const button = (function () {
    switch (status) {
      case "idle":
        return (
          <ButtonBig
            title={`Send to ${recipient.name}`}
            onPress={exec}
            type="primary"
            disabled={dollars === 0}
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig title="Success" disabled />;
      case "error":
        return <ButtonBig title="Error" disabled />;
    }
  })();

  // TODO: load estimated fees
  const fees = 0.05;
  const totalDollars = dollars + fees;

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
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

  return (
    <View style={ss.container.ph16}>
      {button}
      <View style={ss.spacer.h16} />
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
