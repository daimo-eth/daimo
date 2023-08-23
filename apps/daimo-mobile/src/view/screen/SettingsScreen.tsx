import { KeyData } from "@daimo/common";
import { tokenMetadata } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getDebugLog } from "../../debugLog";
import { chainConfig } from "../../logic/chainConfig";
import { pubKeyToEmoji } from "../../logic/device";
import {
  EnclaveSecSummary,
  deleteEnclaveKey,
  getEnclaveSec,
} from "../../logic/enclave";
import { env } from "../../logic/env";
import { getPushNotificationManager } from "../../logic/notify";
import { guessTimestampFromNum, timeAgo, useTime } from "../../logic/time";
import { Account, serializeAccount, useAccount } from "../../model/account";
import { ButtonMed, ButtonSmall } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextBody, TextBold, TextH2, TextH3, TextLight } from "../shared/text";

export function SettingsScreen() {
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
    <ScrollView contentContainerStyle={ss.container.vertModal}>
      <Spacer h={4} />
      <View style={ss.container.ph16}>
        <TextH2>
          {account.name}
          <TextBody>
            {` \u00A0 `}
            {tokenMetadata.name} · {chainConfig.l2.name}
          </TextBody>
        </TextH2>
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
      <Spacer h={32} />
      <DevicesInfo {...{ account }} />
      <Spacer h={32} />

      <AppInfo {...{ account }} />
      <Spacer h={32} />

      <View style={ss.container.ph16}>
        <TextH3>Danger zone</TextH3>
        <Spacer h={8} />
        <ButtonMed type="danger" title="Delete Device" onPress={clearWallet} />
      </View>
    </ScrollView>
  );
}

function DevicesInfo({ account }: { account: Account }) {
  const nav = useNav();

  const addDevice = () => nav.navigate("AddDevice");

  console.log(`[NALIN DEBUG] accountKeys`, JSON.stringify(account.accountKeys));

  return (
    <>
      <View style={styles.keyValueList}>
        <TextH3>Devices</TextH3>
        <Spacer h={8} />
        {account.accountKeys
          .filter((k) => k.removedAt === undefined)
          .map((keyData) => (
            <DeviceRow
              key={keyData.key}
              keyData={keyData}
              isCurrentDevice={keyData.key === account.enclavePubKey}
            />
          ))}
      </View>
      <Spacer h={16} />
      <View style={ss.container.ph16}>
        <ButtonMed type="primary" title="Add Device" onPress={addDevice} />
      </View>
    </>
  );
}

function DeviceRow({
  keyData,
  isCurrentDevice,
}: {
  keyData: KeyData;
  isCurrentDevice: boolean;
}) {
  const nowS = useTime();
  const nav = useNav();

  const viewDevice = () => nav.navigate("Device", { pubKey: keyData.key });

  return (
    <ButtonSmall onPress={viewDevice}>
      <View style={styles.deviceDataRow}>
        <TextBold>
          Device {pubKeyToEmoji(keyData.key)}
          {isCurrentDevice ? " (Current device)" : " "}
        </TextBold>
        <TextBold>
          {timeAgo(guessTimestampFromNum(keyData.addedAt), nowS)}
        </TextBold>
      </View>
    </ButtonSmall>
  );
}

function AppInfo({ account }: { account: Account }) {
  const [sec, setSec] = useState<Awaited<ReturnType<typeof getEnclaveSec>>>();

  useEffect(() => {
    getEnclaveSec().then(setSec);
  }, []);

  const enableNotifications = async () => {
    await Notifications.requestPermissionsAsync();
    try {
      getPushNotificationManager().savePushTokenForAccount();
    } catch (e: any) {
      console.error(e);
      window.alert(e.message);
    }
  };

  const envKV: Record<string, string> = {
    Platform: `${Platform.OS} ${Platform.Version}`,
    Version: `${env.nativeApplicationVersion} #${env.nativeBuildVersion}`,
    Commit: `${env.gitHash} ${env.buildProfile}`,
    Notifications: account.pushToken ? "enabled" : "disabled",
  };
  if (sec) {
    envKV["Key Security"] = getKeySecDescription(sec);
  }

  const sendDebugLog = () => {
    const env = JSON.stringify(envKV, null, 2);
    const accountJSON = serializeAccount(account);
    const debugLog = getDebugLog();
    Share.share(
      {
        title: "Send Debug Log",
        message: `# Daimo Debug Log\n\n${env}\n\n${accountJSON}\n\n${debugLog}`,
      },
      {
        subject: "Daimo Debug Log",
      }
    );
  };

  return (
    <View style={ss.container.ph16}>
      <TextH3>Details</TextH3>
      <Spacer h={8} />
      {Object.entries(envKV).map(([k, v]) => (
        <KV key={k} label={k} value={v} />
      ))}
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

function getKeySecDescription(sec: EnclaveSecSummary) {
  const bio = sec.biometricSecurityLevel === "AVAILABLE" ? "biometrics" : "PIN";
  switch (sec.hardwareSecurityLevel) {
    case "SOFTWARE":
      return `software key, ${bio}`;
    case "TRUSTED_ENVIRONMENT":
      return `Android TEE, ${bio}`;
    case "HARDWARE_ENCLAVE":
      return `secure enclave, ${bio}`;
    default:
      return `${sec.hardwareSecurityLevel}, ${bio}}`;
  }
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <TextBody>
        <TextLight>{label}</TextLight>
        {` \u00A0 `}
        <Text>{value}</Text>
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
  keyValueList: {
    ...ss.container.ph16,
    flex: 1,
    flexDirection: "column",
    gap: 8,
  },
  deviceDataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
