import { getAccountName, getEAccountStr, timeAgo } from "@daimo/common";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
  Platform,
} from "react-native";

import { Account } from "../../../model/account";
import { Recipient, useRecipientSearch } from "../../../sync/recipients";
import useKeyboardHeight from "../../../vendor/useKeyboardHeight";
import { AccountBubble } from "../../shared/AccountBubble";
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
        <InputBig autoFocus icon="search" value={prefix} onChange={setPrefix} />
      </View>
      <Spacer h={24} />
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
      {res.recipients.length === 0 && prefix !== "" && <NoSearchResults />}
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
    <View style={styles.resultBorder}>
      <TouchableHighlight
        onPress={payAccount}
        {...touchHighlightUnderlay.subtle}
        style={styles.resultRowWrap}
      >
        <View style={styles.resultRow}>
          <View style={styles.resultAccount}>
            <AccountBubble eAcc={recipient} size={36} />
            <TextBody>{name}</TextBody>
          </View>
          <TextLight>{lastSendStr}</TextLight>
        </View>
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
    paddingVertical: 16,
    paddingHorizontal: 2,
  },
  resultBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
  },
  resultRowWrap: {
    marginHorizontal: -24,
  },
  resultRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
