import { getAccountName, getEAccountStr, timeAgo } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { Account } from "../../../model/account";
import { Recipient, useRecipientSearch } from "../../../sync/recipients";
import { useKeyboardHeight } from "../../../vendor/useKeyboardHeight";
import { AccountBubble, Bubble } from "../../shared/AccountBubble";
import { ButtonMed } from "../../shared/Button";
import { InputBig } from "../../shared/InputBig";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { useNav } from "../../shared/nav";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

/** Find someone you've already paid, a Daimo user by name, or any Ethereum account by ENS. */
export function SearchTab() {
  const [prefix, setPrefix] = useState("");

  return (
    <>
      <View style={{ flexGrow: 0 }}>
        <InputBig
          autoFocus
          icon="search"
          placeholder="Search user, ENS, or address..."
          value={prefix}
          onChange={setPrefix}
        />
      </View>
      <Spacer h={16} />
      <SearchResults prefix={prefix} />
    </>
  );
}

export function SearchResults({ prefix }: { prefix: string }) {
  const Inner = useWithAccount(SearchResultsScroll);
  return (
    <View style={styles.resultsWrap}>
      <Inner prefix={prefix.trim().toLowerCase()} />
    </View>
  );
}

function SearchResultsScroll({
  account,
  prefix,
}: {
  account: Account;
  prefix: string;
}) {
  const res = useRecipientSearch(account, prefix);

  const recentsOnly = prefix === "";

  const kbH = useKeyboardHeight();

  return (
    <ScrollView
      contentContainerStyle={styles.resultsScroll}
      keyboardShouldPersistTaps="handled"
    >
      {res.error && <ErrorRowCentered error={res.error} />}
      {recentsOnly && <QRRow />}
      {res.recipients.length > 0 && (
        <View style={styles.resultsHeader}>
          <TextLight>
            {recentsOnly ? "Recent recipients" : "Search results"}
          </TextLight>
        </View>
      )}
      {res.recipients.map((r) => (
        <RecipientRow key={r.addr} recipient={r} />
      ))}
      {res.status === "success" &&
        res.recipients.length === 0 &&
        prefix !== "" && <NoSearchResults />}
      <Spacer h={32} />
      {Platform.OS === "ios" && <Spacer h={kbH} />}
    </ScrollView>
  );
}

function NoSearchResults() {
  const nav = useNav();
  const sendPaymentLink = () =>
    nav.navigate("SendTab", { screen: "SendNav", params: { sendNote: true } });

  return (
    <View>
      <Spacer h={16} />
      <TextCenter>
        <TextLight>No results</TextLight>
      </TextCenter>
      <Spacer h={32} />
      <ButtonMed
        type="subtle"
        title="SEND PAYMENT LINK INSTEAD"
        onPress={sendPaymentLink}
      />
    </View>
  );
}

function RecipientRow({ recipient }: { recipient: Recipient }) {
  const eAccStr = getEAccountStr(recipient);
  const nav = useNav();
  const payAccount = useCallback(
    () =>
      nav.navigate("SendTab", {
        screen: "SendTransfer",
        params: { recipient },
      }),
    [eAccStr]
  );

  const name = getAccountName(recipient);
  const nowS = Date.now() / 1e3;
  const lastSendStr =
    recipient.lastSendTime &&
    `Sent ${timeAgo(recipient.lastSendTime, nowS, true)}`;

  return (
    <Row onPress={payAccount}>
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <AccountBubble eAcc={recipient} size={36} />
          <TextBody>{name}</TextBody>
        </View>
        <TextLight>{lastSendStr}</TextLight>
      </View>
    </Row>
  );
}

function QRRow() {
  const nav = useNav();
  return (
    <Row
      key="qrScan"
      onPress={() =>
        nav.navigate("SendTab", {
          screen: "QR",
          params: { option: "SCAN" },
        })
      }
    >
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <Bubble
            inside={<Octicons name="apps" size={16} color={color.primary} />}
            size={36}
          />
          <TextBody>Scan QR code</TextBody>
        </View>
      </View>
    </Row>
  );
}

function Row({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <View>
      <TouchableHighlight
        onPress={onPress}
        {...touchHighlightUnderlay.subtle}
        style={styles.resultRowWrap}
      >
        {children}
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsWrap: {
    flex: 1,
    marginHorizontal: -16,
  },
  resultsScroll: {
    flexDirection: "column",
    alignSelf: "stretch",
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  resultRowWrap: {
    marginHorizontal: -24,
  },
  resultRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultAccount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
