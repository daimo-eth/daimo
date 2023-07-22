import { Octicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Text,
  View,
  StyleSheet,
  ScrollView,
} from "react-native";

import { chainConfig } from "../../logic/chainConfig";
import { deleteEnclaveKey, getEnclaveSec } from "../../logic/enclave";
import { env } from "../../logic/env";
import { getPushNotificationManager } from "../../logic/notify";
import { Account, useAccount } from "../../model/account";
import { ButtonMed, ButtonSmall } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextBody, TextBold, TextH2, TextH3, TextLight } from "../shared/text";

export function AccountScreen() {
  const [account, setAccount] = useAccount();
  const nav = useNav();

  const clearWallet = useCallback(() => {
    // TODO: warn if any assets might be lost. Show a scary confirmation.
    if (!account) return;
    const { enclaveKeyName } = account;

    Alert.alert(
      "Clear wallet",
      `Are you sure you want to clear your wallet? This can't be undone.\n\n` +
        `If this is the only device on your account, you'll lose your account.`,
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
      await deleteEnclaveKey(enclaveKeyName);

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
      <ScrollView contentContainerStyle={ss.container.vertModal}>
        <Spacer h={8} />
        <View style={ss.container.ph16}>
          <TextH2>Account</TextH2>
          <Spacer h={16} />
          <TextH3>{account.name}</TextH3>
        </View>
        <ButtonSmall onPress={linkToExplorer}>
          <View>
            <TextLight>
              {account.address}
              {` \u00A0 `}
              <Octicons name="link-external" size={16} />
              {` \u00A0 `}
              View on {explorer.name}
            </TextLight>
          </View>
        </ButtonSmall>
        <Spacer h={16} />
        <View style={styles.callout}>
          <TextBody>
            <Octicons name="alert" size={16} color="black" />{" "}
            <TextBold>Add or remove device coming soon.</TextBold> Secure your
            account by adding a second phone or laptop.
          </TextBody>
        </View>

        <Spacer h={32} />
        <AppInfo {...{ account }} />

        <Spacer h={32} />
        <View style={ss.container.ph16}>
          <TextH2>Danger zone</TextH2>
          <Spacer h={8} />
          <ButtonMed type="danger" title="Clear wallet" onPress={clearWallet} />
        </View>
      </ScrollView>
    </>
  );
}

function AppInfo({ account }: { account: Account }) {
  const [sec, setSec] = useState<Awaited<ReturnType<typeof getEnclaveSec>>>();

  useEffect(() => {
    getEnclaveSec().then(setSec);
  }, []);

  const enableNotifications = async () => {
    await Notifications.requestPermissionsAsync();
    getPushNotificationManager().maybeSavePushTokenForAccount();
  };

  const sendDebugLog = () => {
    alert("Coming soon");
  };

  return (
    <View style={ss.container.ph16}>
      <TextH2>App and device</TextH2>
      <Spacer h={16} />
      <KV label="Commit" value={env.gitHash} />
      <KV label="Profile" value={env.buildProfile} />
      <KV label="Native Version" value={env.nativeApplicationVersion} />
      <KV label="Native Build" value={env.nativeBuildVersion} />
      {sec && (
        <>
          <KV label="Platform" value={`${Platform.OS} ${Platform.Version}`} />
          <KV
            label="Biometric Security"
            value={sec.biometricSecurityLevel.toLowerCase()}
          />
          <KV
            label="Hardware Security"
            value={sec.hardwareSecurityLevel.toLowerCase()}
          />
        </>
      )}
      <KV
        label="Notifications"
        value={account.pushToken ? "enabled" : "disabled"}
      />
      {!account.pushToken && <Spacer h={8} />}
      {!account.pushToken && (
        <ButtonMed
          type="primary"
          title="Enable notifications"
          onPress={enableNotifications}
        />
      )}

      <Spacer h={8} />
      <ButtonMed type="subtle" title="Send debug log" onPress={sendDebugLog} />
    </View>
  );
}

function KV({ label, value }: { label: string; value?: string | null }) {
  return (
    <View>
      <TextBody>
        <TextLight>{label}</TextLight>
        {` \u00A0 `}
        {value && <TextBold>{value}</TextBold>}
        {!value && <Text>none</Text>}
      </TextBody>
      <Spacer h={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: color.bg.lightGray,
    padding: 16,
    borderRadius: 24,
  },
});
