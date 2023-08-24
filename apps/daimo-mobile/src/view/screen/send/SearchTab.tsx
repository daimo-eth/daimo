import { getAccountName } from "@daimo/common";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { timeAgo } from "../../../logic/time";
import { Recipient, useRecipientSearch } from "../../../sync/recipients";
import { ButtonBig } from "../../shared/Button";
import { InputBig } from "../../shared/InputBig";
import { useNav } from "../../shared/nav";
import { TextCenter, TextError, TextH3, TextLight } from "../../shared/text";

/** Find someone you've already paid, a Daimo user by name, or any Ethereum account by ENS. */
export function SearchTab() {
  const [prefix, setPrefix] = useState("");
  const res = useRecipientSearch(prefix.trim().toLowerCase());

  return (
    <View style={styles.vertSearch}>
      <InputBig icon="search" value={prefix} onChange={setPrefix} />
      {res.error && <ErrorRow error={res.error} />}
      {res.recipients.map((r) => (
        <RecipientRow key={r.addr} recipient={r} />
      ))}
      {res.isSearching && res.recipients.length === 0 && (
        <TextCenter>
          <TextLight>No results</TextLight>
        </TextCenter>
      )}
    </View>
  );
}

function ErrorRow({ error }: { error: { message: string } }) {
  return (
    <TextError>
      <TextCenter>{error.message}</TextCenter>
    </TextError>
  );
}

function RecipientRow({ recipient }: { recipient: Recipient }) {
  const nav = useNav();
  const pay = useCallback(() => nav.setParams({ recipient }), []);

  const name = getAccountName(recipient);
  const nowS = Date.now() / 1e3;
  const lastSendStr =
    recipient.lastSendTime &&
    `Sent ${timeAgo(recipient.lastSendTime, nowS, true)}`;

  return (
    <ButtonBig type="subtle" onPress={pay}>
      <View style={styles.recipientRow}>
        <TextH3>{name}</TextH3>
        <TextLight>{lastSendStr}</TextLight>
      </View>
    </ButtonBig>
  );
}

const styles = StyleSheet.create({
  vertSearch: {
    flexDirection: "column",
    alignSelf: "stretch",
    gap: 8,
  },
  recipientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
});
