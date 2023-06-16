import ExpoEnclave from "@daimo/expo-enclave";
import { useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { env } from "../../logic/env";
import { ButtonMed } from "../shared/Button";
import { useNav } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextBold, TextSmall } from "../shared/text";
import { timeAgo, useTime } from "../shared/time";

export function UserScreen() {
  const [account, setAccount] = useAccount();
  const nowS = useTime();
  const nav = useNav();
  useEffect(() => {
    if (account == null) nav.navigate("Home");
  }, [account, nav]);

  const clearWallet = useCallback(() => {
    // TODO: warn if any assets might be lost. Show a scary confirmation.
    if (!account) return;
    const { enclaveKeyName } = account;

    (async function () {
      console.log(`[USER] deleting account; deleting key ${enclaveKeyName}`);
      await ExpoEnclave.deleteKeyPair(enclaveKeyName);

      setAccount(null);
      nav.navigate("Home");
    })();
  }, []);

  if (!account) return null;

  return (
    <>
      <View style={styles.container}>
        <Text style={ss.text.h2}>Account</Text>
        <Text style={ss.text.body} numberOfLines={1}>
          {account.address}
        </Text>
        <Text style={ss.text.body}>Bal {"" + account.lastBalance}</Text>
        <Text style={ss.text.body}>
          As of {timeAgo(account.lastBlockTimestamp, nowS)}
        </Text>
        <ButtonMed type="danger" title="Clear wallet" onPress={clearWallet} />

        <View style={ss.spacer.h64} />
        <TextSmall>
          Build <TextBold>{env.gitHash}</TextBold>
        </TextSmall>
        <TextSmall>
          Profile <TextBold>{env.buildProfile}</TextBold>
        </TextSmall>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.white,
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "column",
    gap: 8,
    padding: 16,
    alignItems: "flex-start",
  },
});
