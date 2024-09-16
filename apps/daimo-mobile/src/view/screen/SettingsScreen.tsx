import {
  KeyData,
  getSlotLabel,
  guessTimestampFromNum,
  timeAgo,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { useSendDebugLog } from "../../common/useSendDebugLog";
import { env } from "../../env";
import { i18NLocale, i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { useNotificationsAccess } from "../../logic/notify";
import { useTime } from "../../logic/time";
import { Account, toEAccount } from "../../storage/account";
import { AccountCopyLinkButton } from "../shared/AccountCopyLinkButton";
import { Badge } from "../shared/Badge";
import { ContactBubble } from "../shared/Bubble";
import {
  BadgeButton,
  ButtonMed,
  DescriptiveClickableRow,
  TextButton,
} from "../shared/Button";
import { FarcasterButton } from "../shared/FarcasterBubble";
import { Icon } from "../shared/Icon";
import { ClockIcon, PlusIcon } from "../shared/Icons";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { PendingDot } from "../shared/StatusDot";
import { openSupportTG } from "../shared/error";
import {
  TextBody,
  TextBodyMedium,
  TextLight,
  TextMeta,
  TextPara,
} from "../shared/text";
import { SkinSelector } from "../style/SkinSelector";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

const i18 = i18n.settings;

export function SettingsScreen() {
  const account = useAccount();
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const [showDetails, setShowDetails] = useState(false);

  if (!account) return null;

  return (
    <View style={styles.pageWrap}>
      <View style={ss.container.padH16}>
        <ScreenHeader title={i18n.settings.screenHeader()} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Spacer h={16} />
        <AccountSection account={account} />
        <Spacer h={32} />
        <DevicesSection account={account} />
        <TextButton
          title={
            showDetails
              ? i18n.settings.hideDetails()
              : i18n.settings.showDetails()
          }
          onPress={() => setShowDetails(!showDetails)}
        />
        <Spacer h={16} />
        {showDetails && <DetailsSection account={account} />}
      </ScrollView>
    </View>
  );
}

function AccountSection({ account }: { account: Account }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
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
      <AccountHeader account={account} />
      <Spacer h={16} />
      {account.linkedAccounts.length === 0 && (
        <>
          <ButtonMed
            type="primary"
            title={i18.account.connectFarcaster()}
            onPress={connectFarc}
          />
          <Spacer h={16} />
        </>
      )}
      <ButtonMed
        type="subtle"
        title={i18.account.viewAccountOnExplorer()}
        onPress={linkToExplorer}
      />
    </View>
  );
}

export function AccountHeader({
  account,
  noLinkedAccounts,
}: {
  account: Account;
  noLinkedAccounts?: boolean;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
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
        <Spacer h={2} />
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <TextBodyMedium color={color.gray3}>
            {tokenSymbol} · {l2Name}
          </TextBodyMedium>
        </View>
        {!noLinkedAccounts && (
          <LinkedAccountsRow linkedAccounts={account.linkedAccounts} />
        )}
      </View>
    </View>
  );
}

function LinkedAccountsRow({
  linkedAccounts,
}: {
  linkedAccounts: Account["linkedAccounts"];
}) {
  const dispatcher = useContext(DispatcherContext);
  const connectFarc = () => dispatcher.dispatch({ name: "connectFarcaster" });

  if (linkedAccounts.length === 0) {
    return (
      <BadgeButton
        title={i18.account.noSocialsConnected()}
        onPress={connectFarc}
      />
    );
  }

  // Generalize once needed
  const fcAccount = linkedAccounts[0];
  return <FarcasterButton fcAccount={fcAccount} onPress={connectFarc} />;
}

function DevicesSection({ account }: { account: Account }) {
  const nav = useNav();
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const dispatcher = useContext(DispatcherContext);
  const addDevice = () => nav.navigate("SettingsTab", { screen: "AddDevice" });
  const createBackup = () => {
    dispatcher.dispatch({ name: "createBackup" });
  };
  const [showSkinSelector, setShowSkinSelector] = useState(false);

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
        isOnlyDevice={account.accountKeys.length === 1}
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
  const openHelpModal = () =>
    dispatcher.dispatch({
      name: "helpModal",
      title: i18.devices.passkeys.title(),
      content: (
        <>
          <TextPara>{i18.devices.passkeys.description.firstPara()}</TextPara>
          <Spacer h={16} />
          <TextPara>{i18.devices.passkeys.description.secondPara()}</TextPara>
        </>
      ),
    });

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>{i18.devices.title()}</TextLight>
      </View>
      <Spacer h={8} />
      <View
        style={styles.listBody}
        children={currentKeyRows.concat(pendingDeviceRows)}
      />
      <Spacer h={24} />
      <DescriptiveClickableRow
        title={i18.devices.createBackup.title()}
        message={i18.devices.createBackup.msg()}
        icon={<ClockIcon color={color.gray3} style={{ top: 7 }} />}
        onPressHelp={openHelpModal}
      />
      <ButtonMed
        type="subtle"
        title={i18.devices.createBackup.button()}
        onPress={createBackup}
      />
      <View style={styles.separator} />
      <DescriptiveClickableRow
        title={i18.devices.addDevice.title()}
        message={i18.devices.addDevice.msg()}
        icon={<PlusIcon color={color.gray3} style={{ top: 7 }} />}
      />
      <ButtonMed
        type="subtle"
        title={i18.devices.addDevice.button()}
        onPress={addDevice}
      />
      <View style={styles.separator} />
      <DescriptiveClickableRow
        title={i18.devices.contactSupport.title()}
        message={i18.devices.contactSupport.msg()}
        icon={
          <Pressable
            style={{ width: 24 }}
            onPress={() => setShowSkinSelector(!showSkinSelector)}
          >
            {showSkinSelector ? (
              <View style={{ paddingTop: 8 }}>
                <TextLight>🤫</TextLight>
              </View>
            ) : (
              <Icon
                name="help-circle"
                size={24}
                color={color.gray3}
                style={{ top: 7 }}
              />
            )}
          </Pressable>
        }
      />
      {showSkinSelector ? (
        <SkinSelector />
      ) : (
        <ButtonMed
          type="subtle"
          title={i18.devices.contactSupport.button()}
          onPress={openSupportTG}
        />
      )}

      <View style={styles.separator} />
    </View>
  );
}

function DeviceRow({
  keyData,
  isCurrentDevice,
  isOnlyDevice,
  chain,
  pendingRemoval,
}: {
  keyData: KeyData;
  isCurrentDevice: boolean;
  isOnlyDevice: boolean;
  chain: DaimoChain;
  pendingRemoval: boolean;
}) {
  const nowS = useTime();
  const nav = useNav();
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

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
    ? i18.pending()
    : i18.addedAgo(timeAgo(addAtS, i18NLocale, nowS, true));
  const cta = (() => {
    if (isCurrentDevice && isOnlyDevice) return i18.delete();
    if (isCurrentDevice) return i18.logOut();
    return i18.remove();
  })();
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
            {isCurrentDevice && !pendingRemoval && (
              <Badge color={color.grayMid}>{i18.devices.thisDevice()}</Badge>
            )}
            {pendingRemoval && <PendingDot />}
          </View>
          <View style={styles.rowRight}>
            {!isCurrentDevice && (
              <TextMeta color={color.gray3}>{dispTime}</TextMeta>
            )}
            {!isCurrentDevice && <Spacer w={16} />}
            <TextMeta color={pendingRemoval ? color.gray3 : color.primary}>
              {cta}
            </TextMeta>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function PendingDeviceRow({ slot }: { slot: number }) {
  const dispName = getSlotLabel(slot);
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

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
            <TextMeta color={color.gray3}>{i18.pending()}</TextMeta>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function DetailsSection({ account }: { account: Account }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const { ask } = useNotificationsAccess();

  const [sendDebugLog, debugEnvSummary] = useSendDebugLog(account);

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>{i18.details.title()}</TextLight>
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
          title={i18.details.enableNotifications()}
          onPress={ask}
        />
      )}
      {!account.pushToken && <Spacer h={16} />}
      <ButtonMed
        type="subtle"
        title={i18.details.sendDebugLog()}
        onPress={sendDebugLog}
      />
      <Spacer h={32} />
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  return (
    <View style={styles.kvRow}>
      <View style={styles.kvKey}>
        <TextMeta color={color.grayDark}>{label}</TextMeta>
      </View>
      <TextMeta color={color.gray3}>{value}</TextMeta>
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
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
  });
