import { getAccountName } from "@daimo/common";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Recipient, useRecipientSearch } from "../../../sync/loadRecipients";
import { ButtonBig } from "../../shared/Button";
import { InputBig } from "../../shared/Input";
import { useNav } from "../../shared/nav";
import { TextCenter, TextError, TextLight } from "../../shared/text";

/** Find someone you've already paid, or any Daimo account by name. */
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
  return (
    <ButtonBig type="subtle" title={getAccountName(recipient)} onPress={pay} />
  );
}

const styles = StyleSheet.create({
  vertSearch: {
    flexDirection: "column",
    alignSelf: "stretch",
    gap: 8,
  },
});
