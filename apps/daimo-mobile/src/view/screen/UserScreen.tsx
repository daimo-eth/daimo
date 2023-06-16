import ExpoEnclave from "@daimo/expo-enclave";
import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { useAccount } from "../../logic/account";
import { env } from "../../logic/env";
import { ButtonMed } from "../shared/Button";
import { useNav } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextBold, TextH2, TextSmall } from "../shared/text";

export function UserScreen() {
  const [account, setAccount] = useAccount();
  const nav = useNav();

  const clearWallet = useCallback(() => {
    // TODO: warn if any assets might be lost. Show a scary confirmation.
    if (!account) return;
    const { enclaveKeyName } = account;

    Alert.alert(
      "Clear wallet",
      `Are you sure you want to clear your wallet? This can't be undone.`,
      [
        {
          text: "Clear wallet",
          onPress: clearWallet,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );

    async function clearWallet() {
      console.log(`[USER] deleting account; deleting key ${enclaveKeyName}`);
      await ExpoEnclave.deleteKeyPair(enclaveKeyName);

      setAccount(null);
      nav.navigate("Home");
    }
  }, []);

  if (!account) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={ss.spacer.h16} />
        <TextH2>Account</TextH2>
        <View style={ss.spacer.h8} />
        <TextSmall>{account.address}</TextSmall>
        <View style={ss.spacer.h16} />
        <ButtonMed type="danger" title="Clear wallet" onPress={clearWallet} />

        <View style={ss.spacer.h64} />
        <TextH2>App info</TextH2>
        <View style={ss.spacer.h8} />
        <TextSmall>
          Commit <TextBold>{env.gitHash}</TextBold>
        </TextSmall>
        <TextSmall>
          Profile <TextBold>{env.buildProfile}</TextBold>
        </TextSmall>
        <TextSmall>
          Native Version <TextBold>{env.nativeApplicationVersion}</TextBold>
        </TextSmall>
        <TextSmall>
          Native Build <TextBold>{env.nativeBuildVersion}</TextBold>
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
