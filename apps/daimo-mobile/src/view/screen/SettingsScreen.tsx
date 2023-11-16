import {
  KeyData,
  formatDaimoLink,
  getSlotLabel,
  guessTimestampFromNum,
  timeAgo,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import * as ExpoEnclave from "@daimo/expo-enclave";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { getDebugLog } from "../../debugLog";
import { getHardwareSec } from "../../logic/enclave";
import { env } from "../../logic/env";
import { getPushNotificationManager } from "../../logic/notify";
import { useTime } from "../../logic/time";
import {
  Account,
  serializeAccount,
  toEAccount,
  useAccount,
} from "../../model/account";
import { AccountBubble } from "../shared/AccountBubble";
import { amountSeparator } from "../shared/Amount";
import { Badge } from "../shared/Badge";
import { ButtonMed, TextButton } from "../shared/Button";
import { PendingDot } from "../shared/PendingDot";
import { ScreenHeader, useExitToHome } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextH3, TextLight, TextMeta } from "../shared/text";

export function SettingsScreen() {
  const [account] = useAccount();
  const goHome = useExitToHome();

  const [showDetails, setShowDetails] = useState(false);

  if (!account) return null;

  return (
    <View style={styles.pageWrap}>
      <View style={ss.container.padH16}>
        <ScreenHeader title="Settings" onBack={goHome} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Spacer h={16} />
        <AccountSection account={account} />
        <Spacer h={32} />
        <DevicesSection account={account} />
        <Spacer h={8} />
        <TextButton
          title={showDetails ? "Hide details" : "Show details"}
          onPress={() => setShowDetails(!showDetails)}
        />
        <Spacer h={8} />
        {showDetails && <DetailsSection account={account} />}
      </ScrollView>
    </View>
  );
}

function AccountSection({ account }: { account: Account }) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  const { chainConfig } = env(daimoChain);
  const explorer = chainConfig.chainL2.blockExplorers!.default;
  const linkToExplorer = useCallback(() => {
    const url = `${explorer.url}/address/${account.address}`;
    Linking.openURL(url);
  }, [account]);

  return (
    <View style={styles.sectionWrap}>
      <AccountHero account={account} />
      <Spacer h={16} />
      <ButtonMed
        type="subtle"
        title="View account on explorer"
        onPress={linkToExplorer}
      />
    </View>
  );
}

function AccountHero({ account }: { account: Account }) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  const { chainConfig } = env(daimoChain);
  const tokenSymbol = chainConfig.tokenSymbol;
  const l2Name = chainConfig.chainL2.name;

  const acctUrl = formatDaimoLink({ type: "account", account: account.name });
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(acctUrl);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [acctUrl]);

  return (
    <View style={styles.accountHero}>
      <AccountBubble eAcc={toEAccount(account)} size={64} />
      <View>
        <TouchableHighlight
          {...touchHighlightUnderlay.subtle}
          style={{
            paddingVertical: 4,
            paddingHorizontal: 8,
            marginLeft: -8,
            borderRadius: 4,
          }}
          hitSlop={16}
          onPress={copy}
        >
          <TextH3>
            {account.name}
            <Spacer w={8} />
            <Octicons
              name={justCopied ? "check" : "copy"}
              color={color.grayDark}
              size={16}
            />
          </TextH3>
        </TouchableHighlight>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <TextH3 color={color.gray3}>
            {tokenSymbol} · {l2Name}{" "}
            {chainConfig.chainL2.testnet && <Badge>TESTNET</Badge>}
          </TextH3>
        </View>
      </View>
    </View>
  );
}

function DevicesSection({ account }: { account: Account }) {
  const nav = useNav();
  const addDevice = () => nav.navigate("SettingsTab", { screen: "AddDevice" });
  const createBackup = () =>
    nav.navigate("SettingsTab", { screen: "AddPasskey" });

  const sortKey: (k: KeyData) => number = (k) => {
    // Our own key always first
    if (k.pubKey === account.enclavePubKey) return -1;
    // Rest in order
    return k.slot;
  };

  const currentKeyRows = account.accountKeys
    .sort((a, b) => sortKey(a) - sortKey(b))
    .map((keyData) => (
      <DeviceRow
        key={keyData.slot}
        keyData={keyData}
        isCurrentDevice={keyData.pubKey === account.enclavePubKey}
        chain={daimoChainFromId(account.homeChainId)}
        pendingRemoval={
          account.pendingKeyRotation.find(
            (k) => k.rotationType === "remove" && k.slot === keyData.slot
          ) !== undefined
        }
      />
    ));

  const pendingDeviceRows = useCallback(() => {
    return account.pendingKeyRotation
      .filter((k) => k.rotationType === "add")
      .map((k) => <PendingDeviceRow key={k.slot} slot={k.slot} />);
  }, [account.pendingKeyRotation])();

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>My devices &amp; backups</TextLight>
      </View>
      <Spacer h={8} />
      <View
        style={styles.listBody}
        children={currentKeyRows.concat(pendingDeviceRows)}
      />
      <Spacer h={16} />
      <ButtonMed type="primary" title="CREATE BACKUP" onPress={createBackup} />
      <Spacer h={16} />
      <ButtonMed type="subtle" title="ADD DEVICE" onPress={addDevice} />
    </View>
  );
}

function DeviceRow({
  keyData,
  isCurrentDevice,
  chain,
  pendingRemoval,
}: {
  keyData: KeyData;
  isCurrentDevice: boolean;
  chain: DaimoChain;
  pendingRemoval: boolean;
}) {
  const nowS = useTime();
  const nav = useNav();

  const viewDevice = () => {
    if (!pendingRemoval)
      nav.navigate("SettingsTab", {
        screen: "Device",
        params: { pubKey: keyData.pubKey },
      });
  };

  const addAtS = guessTimestampFromNum(keyData.addedAt, chain);

  const dispName = getSlotLabel(keyData.slot);
  const dispTime = pendingRemoval
    ? "Pending"
    : "Added " + timeAgo(addAtS, nowS, true);
  const textCol = pendingRemoval ? color.gray3 : color.midnight;

  return (
    <View style={styles.rowBorder}>
      <TouchableHighlight
        onPress={viewDevice}
        {...touchHighlightUnderlay.subtle}
        style={styles.rowWrap}
      >
        <View style={styles.row}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <TextBody color={textCol}>{dispName}</TextBody>
            {(isCurrentDevice || pendingRemoval) && <Spacer w={12} />}
            {isCurrentDevice && !pendingRemoval && <Badge>THIS DEVICE</Badge>}
            {pendingRemoval && <PendingDot />}
          </View>
          <View style={styles.rowRight}>
            <TextMeta color={color.gray3}>{dispTime}</TextMeta>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function PendingDeviceRow({ slot }: { slot: number }) {
  const dispName = getSlotLabel(slot);

  return (
    <View style={styles.rowBorder}>
      <TouchableHighlight
        onPress={() => {}}
        {...touchHighlightUnderlay.subtle}
        style={styles.rowWrap}
      >
        <View style={styles.row}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <TextBody color={color.gray3}>{dispName}</TextBody>
            <Spacer w={12} />
            <PendingDot />
          </View>
          <View style={styles.rowRight}>
            <TextMeta color={color.gray3}>Pending</TextMeta>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function DetailsSection({ account }: { account: Account }) {
  const [sec, setSec] = useState<Awaited<ReturnType<typeof getHardwareSec>>>();

  useEffect(() => {
    getHardwareSec().then(setSec);
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

  const daimoChain = daimoChainFromId(account.homeChainId);
  const envObj = env(daimoChain);
  const envKV: Record<string, string> = {
    Platform: `${Platform.OS} ${Platform.Version} ${envObj.deviceType}`,
    Version: `${envObj.nativeApplicationVersion} #${envObj.nativeBuildVersion}`,
    Commit: `${envObj.gitHash} ${envObj.buildProfile}`,
    Notifications: account.pushToken ? "enabled" : "disabled",
  };
  if (sec) {
    envKV["Key Security"] = getKeySecDescription(sec);
  }

  const sendDebugLog = () => {
    const env = JSON.stringify({ ...envKV, amountSeparator }, null, 2);
    const accountJSON = serializeAccount(account);
    const debugLog = getDebugLog();
    Share.share(
      {
        title: "Send Debug Log",
        message: [`# Daimo Debug Log`, env, accountJSON, debugLog].join("\n\n"),
      },
      {
        subject: "Daimo Debug Log",
      }
    );
  };

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>Device details</TextLight>
      </View>
      <Spacer h={4} />
      <View style={styles.kvList}>
        {Object.entries(envKV).map(([k, v]) => (
          <KV key={k} label={k} value={v} />
        ))}
      </View>
      {!account.pushToken && <Spacer h={8} />}
      {!account.pushToken && (
        <ButtonMed
          type="subtle"
          title="Enable notifications"
          onPress={enableNotifications}
        />
      )}
      <Spacer h={16} />
      <ButtonMed type="subtle" title="Send debug log" onPress={sendDebugLog} />
      <Spacer h={32} />
    </View>
  );
}

function getKeySecDescription(
  hardwareSecurityLevel: ExpoEnclave.HardwareSecurityLevel
) {
  switch (hardwareSecurityLevel) {
    case "SOFTWARE":
      return "software key";
    case "TRUSTED_ENVIRONMENT":
      return "Android TEE";
    case "HARDWARE_ENCLAVE":
      return "secure enclave";
    default:
      return `${hardwareSecurityLevel}`;
  }
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <View style={styles.kvKey}>
        <TextMeta color={color.grayDark}>{label}</TextMeta>
      </View>
      <TextMeta>{value}</TextMeta>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    backgroundColor: color.white,
  },
  scrollContainer: {
    alignItems: "stretch",
    paddingHorizontal: 24,
  },
  sectionWrap: {},
  accountHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  listBody: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: color.grayLight,
  },
  headerRow: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
  },
  rowWrap: {
    marginHorizontal: -24,
  },
  row: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
  kvList: {
    flexDirection: "column",
    paddingHorizontal: 4,
    gap: 8,
  },
  kvRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  kvKey: {
    width: 128,
  },
  pendingDot: {
    width: 16,
    height: 16,
    borderRadius: 16,
    backgroundColor: color.yellow,
  },
});
