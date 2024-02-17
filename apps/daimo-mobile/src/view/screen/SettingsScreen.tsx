import {
  KeyData,
  getSlotLabel,
  guessTimestampFromNum,
  timeAgo,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import * as Notifications from "expo-notifications";
import React, { ReactNode, useCallback, useContext, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useSendDebugLog } from "../../common/useSendDebugLog";
import { env } from "../../logic/env";
import { getPushNotificationManager } from "../../logic/notify";
import { useTime } from "../../logic/time";
import { Account, toEAccount, useAccount } from "../../model/account";
import { AccountCopyLinkButton } from "../shared/AccountCopyLinkButton";
import { Badge } from "../shared/Badge";
import { ButtonMed, TextButton } from "../shared/Button";
import { ContactBubble } from "../shared/ContactBubble";
import { ClockIcon, PlusIcon } from "../shared/Icons";
import { PendingDot } from "../shared/PendingDot";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { useExitToHome, useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { DaimoText, TextBody, TextLight, TextMeta } from "../shared/text";

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
        <TextButton
          title={showDetails ? "Hide details" : "Show details"}
          onPress={() => setShowDetails(!showDetails)}
        />
        <Spacer h={16} />
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

  const dispatcher = useContext(DispatcherContext);
  const connectFarc = () => dispatcher.dispatch({ name: "connectFarcaster" });

  return (
    <View style={styles.sectionWrap}>
      <AccountHero account={account} />
      <Spacer h={24} />
      <ButtonMed
        type="primary"
        title="CONNECT FARCASTER"
        onPress={connectFarc}
      />
      <Spacer h={16} />
      <ButtonMed
        type="subtle"
        title="VIEW ACCOUNT ON EXPLORER"
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

  const eAcc = toEAccount(account);

  return (
    <View style={styles.accountHero}>
      <ContactBubble contact={{ type: "eAcc", ...eAcc }} size={64} />
      <View>
        <AccountCopyLinkButton eAcc={eAcc} size="h3" />
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <TextBody color={color.gray3}>
            {tokenSymbol} · {l2Name}
            {chainConfig.chainL2.testnet && <> · TESTNET</>}
          </TextBody>
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
      <Spacer h={24} />
      <ButtonInfo
        title="Create a Passkey Backup"
        message="Secured by your password manager"
        icon={<ClockIcon color={color.gray3} style={{ top: 7 }} />}
      />
      <ButtonMed type="subtle" title="CREATE BACKUP" onPress={createBackup} />
      <View style={styles.separator} />
      <ButtonInfo
        title="Add a Device"
        message="Use your account on another device"
        icon={<PlusIcon color={color.gray3} style={{ top: 7 }} />}
      />
      <ButtonMed type="subtle" title="ADD DEVICE" onPress={addDevice} />
      <View style={styles.separator} />
    </View>
  );
}

function ButtonInfo({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.buttonInfoContainer}>
      {icon}
      <View style={styles.messageContainer}>
        <TextBody color={color.midnight}>{title}</TextBody>
        <DaimoText style={styles.infoMessageText}>{message}</DaimoText>
      </View>
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
            {!isCurrentDevice && (
              <TextMeta color={color.gray3}>{dispTime}</TextMeta>
            )}
            {!isCurrentDevice && <Spacer w={16} />}
            <TextMeta color={pendingRemoval ? color.gray3 : color.primary}>
              {isCurrentDevice && "Log out"}
              {!isCurrentDevice && "Remove"}
            </TextMeta>
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
  const enableNotifications = async () => {
    await Notifications.requestPermissionsAsync();
    try {
      getPushNotificationManager().savePushTokenForAccount();
    } catch (e: any) {
      console.error(e);
      window.alert(e.message);
    }
  };

  const [sendDebugLog, debugEnvSummary] = useSendDebugLog(account);

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>Device details</TextLight>
      </View>
      <Spacer h={4} />
      <View style={styles.kvList}>
        {Object.entries(debugEnvSummary).map(([k, v]) => (
          <KV key={k} label={k} value={v} />
        ))}
      </View>
      <Spacer h={24} />
      {!account.pushToken && (
        <ButtonMed
          type="subtle"
          title="Enable notifications"
          onPress={enableNotifications}
        />
      )}
      {!account.pushToken && <Spacer h={16} />}
      <ButtonMed type="subtle" title="Send debug log" onPress={sendDebugLog} />
      <Spacer h={32} />
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <View style={styles.kvKey}>
        <TextMeta color={color.grayDark}>{label}</TextMeta>
      </View>
      <TextMeta color={color.gray3}>{value}</TextMeta>
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
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
  },
  separator: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
    marginVertical: 24,
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
    flexDirection: "row",
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
  messageContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoMessageText: {
    fontSize: 16,
    lineHeight: 20,
    color: color.gray3,
    fontWeight: "500",
  },
  buttonInfoContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
});
