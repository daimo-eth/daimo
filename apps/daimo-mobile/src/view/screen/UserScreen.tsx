import * as ExpoEnclave from "@daimo/expo-enclave";
import { Octicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";

import { useAccount } from "../../logic/account";
import { chainConfig } from "../../logic/chain";
import { env } from "../../logic/env";
import { ButtonMed, ButtonSmall } from "../shared/Button";
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

  const explorer = chainConfig.l2.blockExplorers.default;
  const linkToExplorer = useCallback(() => {
    if (!account) return;
    const url = `${explorer.url}/address/${account.address}`;
    Linking.openURL(url);
  }, [account]);

  if (!account) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={ss.spacer.h16} />
        <View style={ss.container.ph16}>
          <TextH2>Account</TextH2>
        </View>
        <ButtonSmall onPress={linkToExplorer}>
          <View>
            <TextSmall>{account.address}</TextSmall>
            <View style={ss.spacer.h8} />
            <TextSmall>
              <Octicons name="link-external" size={16} />
              {` \u00A0 `}
              View on {explorer.name}
            </TextSmall>
          </View>
        </ButtonSmall>
        <View style={ss.spacer.h8} />
        <View style={ss.container.ph16}>
          <ButtonMed type="danger" title="Clear wallet" onPress={clearWallet} />
        </View>

        <View style={ss.spacer.h64} />
        <AppInfo />
      </View>
    </>
  );
}

function AppInfo() {
  const [sec, setSec] = useState<Awaited<ReturnType<typeof getEnclaveSec>>>();

  useEffect(() => {
    getEnclaveSec().then(setSec);
  }, []);

  return (
    <View style={styles.keyValueList}>
      <TextH2>App and device</TextH2>
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
      {sec && (
        <>
          <TextSmall>
            Platform{" "}
            <TextBold>
              {Platform.OS} {Platform.Version}{" "}
            </TextBold>
          </TextSmall>
          <TextSmall>
            Biometric Security{" "}
            <TextBold>{sec.biometricSecurityLevel.toLowerCase()}</TextBold>
          </TextSmall>
          <TextSmall>
            Hardware Security{" "}
            <TextBold>{sec.hardwareSecurityLevel.toLowerCase()}</TextBold>
          </TextSmall>
        </>
      )}
    </View>
  );
}

async function getEnclaveSec() {
  const promises = [
    ExpoEnclave.getBiometricSecurityLevel(),
    ExpoEnclave.getHardwareSecurityLevel(),
  ] as const;
  const results = await Promise.all(promises);
  return {
    biometricSecurityLevel: results[0],
    hardwareSecurityLevel: results[1],
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: color.white,
    alignSelf: "stretch",
    padding: 16,
    alignItems: "flex-start",
  },
  keyValueList: {
    ...ss.container.ph16,
    flex: 1,
    flexDirection: "column",
    gap: 8,
  },
});
