import {
  KeyData,
  getSlotLabel,
  guessTimestampFromNum,
  timeAgo,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import React, { useCallback, useContext, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { useSendDebugLog } from "../../common/useSendDebugLog";
import { env } from "../../env";
import { Locales, TranslationFunctions } from "../../i18n/i18n-types";
import { getAccountManager, useAccount } from "../../logic/accountManager";
import { useI18n } from "../../logic/i18n";
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
import { DropdownPickButton } from "../shared/DropdownPickButton";
import { FarcasterButton } from "../shared/FarcasterBubble";
import { Icon } from "../shared/Icon";
import { ClockIcon, PlusIcon } from "../shared/Icons";
import { PendingDot } from "../shared/PendingDot";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { openSupportTG } from "../shared/error";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import {
  DaimoText,
  TextBody,
  TextBodyMedium,
  TextColor,
  TextLight,
  TextMeta,
  TextPara,
} from "../shared/text";

export function SettingsScreen() {
  const account = useAccount();
  const i18n = useI18n();

  const [showDetails, setShowDetails] = useState(false);

  if (!account) return null;

  return (
    <View style={styles.pageWrap}>
      <View style={ss.container.padH16}>
        <ScreenHeader title={i18n.settings.screenHeader()} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Spacer h={16} />
        <AccountSection account={account} _i18n={i18n} />
        <Spacer h={32} />
        <DevicesSection account={account} />
        <Spacer h={32} />
        {/* <LocaleSelector locale="en" /> */}
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

function AccountSection({
  account,
  _i18n,
}: {
  account: Account;
  _i18n: TranslationFunctions;
}) {
  const i18n = _i18n.settings.account;
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
            title={i18n.connectFarcaster()}
            onPress={connectFarc}
          />
          <Spacer h={16} />
        </>
      )}
      <ButtonMed
        type="subtle"
        title={i18n.viewAccountOnExplorer()}
        onPress={linkToExplorer}
      />
    </View>
  );
}

// function LocaleSelector({ locale }: { locale: Locales }) {
//   return (
//     <SelectDropdown
//       data={["en"]} // TODO: add all locales
//       defaultValue={locale}
//       onSelect={(selectedLocale: Locales) => {
//         getAccountManager().setLocale(selectedLocale);
//       }}
//       renderButton={() => (
//         <View>
//           <DropdownPickButton />
//         </View>
//       )}
//       renderItem={(l) => (
//         <View>
//           <LocaleLanguage language={l} />
//         </View>
//       )}
//     />
//   );
// }

function LocaleLanguage({ language }: { language: Locales }) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: color.grayLight,
        paddingHorizontal: 24,
        paddingVertical: 13,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <DaimoText variant="dropdown">
        {language === "en" ? "English" : "Español"}
      </DaimoText>
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
  const daimoChain = daimoChainFromId(account.homeChainId);
  const { chainConfig } = env(daimoChain);
  const tokenSymbol = chainConfig.tokenSymbol;
  const l2Name = chainConfig.chainL2.name;
  const isTestnet = chainConfig.chainL2.testnet;

  const eAcc = toEAccount(account);

  return (
    <View style={styles.accountHero}>
      <ContactBubble contact={{ type: "eAcc", ...eAcc }} size={64} />
      <View>
        <AccountCopyLinkButton eAcc={eAcc} size="h3" />
        <Spacer h={2} />
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <TextBodyMedium color={color.gray3}>
            {tokenSymbol} ·{" "}
            {isTestnet ? (
              <TextColor color={color.success}>{l2Name}</TextColor>
            ) : (
              l2Name
            )}
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
  const i18n = useI18n().settings.account;
  const dispatcher = useContext(DispatcherContext);
  const connectFarc = () => dispatcher.dispatch({ name: "connectFarcaster" });

  if (linkedAccounts.length === 0) {
    return (
      <BadgeButton title={i18n.noSocialsConnected()} onPress={connectFarc} />
    );
  }

  // Generalize once needed
  const fcAccount = linkedAccounts[0];
  return <FarcasterButton fcAccount={fcAccount} onPress={connectFarc} />;
}

function DevicesSection({ account }: { account: Account }) {
  const i18n = useI18n().settings.devices;
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);
  const addDevice = () => nav.navigate("SettingsTab", { screen: "AddDevice" });
  const createBackup = () => {
    dispatcher.dispatch({ name: "createBackup" });
  };

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
  const openHelpModal = () =>
    dispatcher.dispatch({
      name: "helpModal",
      title: i18n.passkeys.title(),
      content: (
        <>
          <TextPara>{i18n.passkeys.description.firstPara()}</TextPara>
          <Spacer h={16} />
          <TextPara>{i18n.passkeys.description.secondPara()}</TextPara>
        </>
      ),
    });

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>{i18n.title()}</TextLight>
      </View>
      <Spacer h={8} />
      <View
        style={styles.listBody}
        children={currentKeyRows.concat(pendingDeviceRows)}
      />
      <Spacer h={24} />
      <DescriptiveClickableRow
        title={i18n.createBackup.title()}
        message={i18n.createBackup.msg()}
        icon={<ClockIcon color={color.gray3} style={{ top: 7 }} />}
        onPressHelp={openHelpModal}
      />
      <ButtonMed
        type="subtle"
        title={i18n.createBackup.button()}
        onPress={createBackup}
      />
      <View style={styles.separator} />
      <DescriptiveClickableRow
        title={i18n.addDevice.title()}
        message={i18n.addDevice.msg()}
        icon={<PlusIcon color={color.gray3} style={{ top: 7 }} />}
      />
      <ButtonMed
        type="subtle"
        title={i18n.addDevice.button()}
        onPress={addDevice}
      />
      <View style={styles.separator} />
      <DescriptiveClickableRow
        title={i18n.contactSupport.title()}
        message={i18n.contactSupport.msg()}
        icon={
          <Icon
            name="help-circle"
            size={24}
            color={color.gray3}
            style={{ top: 7 }}
          />
        }
      />
      <ButtonMed
        type="subtle"
        title={i18n.contactSupport.button()}
        onPress={openSupportTG}
      />
      <View style={styles.separator} />
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
  const i18n = useI18n().settings;
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
    ? i18n.pending()
    : i18n.addedAgo({ timeAgo: timeAgo(addAtS, nowS, true) });
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
              <Badge color={color.grayMid}>{i18n.devices.thisDevice()}</Badge>
            )}
            {pendingRemoval && <PendingDot />}
          </View>
          <View style={styles.rowRight}>
            {!isCurrentDevice && (
              <TextMeta color={color.gray3}>{dispTime}</TextMeta>
            )}
            {!isCurrentDevice && <Spacer w={16} />}
            <TextMeta color={pendingRemoval ? color.gray3 : color.primary}>
              {isCurrentDevice && i18n.logOut()}
              {!isCurrentDevice && i18n.remove()}
            </TextMeta>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function PendingDeviceRow({ slot }: { slot: number }) {
  const dispName = getSlotLabel(slot);
  const i18n = useI18n().settings;

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
            <TextMeta color={color.gray3}>{i18n.pending()}</TextMeta>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

function DetailsSection({ account }: { account: Account }) {
  const { ask } = useNotificationsAccess();
  const i18n = useI18n().settings.details;

  const [sendDebugLog, debugEnvSummary] = useSendDebugLog(account);

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headerRow}>
        <TextLight>{i18n.title()}</TextLight>
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
          title={i18n.enableNotifications()}
          onPress={ask}
        />
      )}
      {!account.pushToken && <Spacer h={16} />}
      <ButtonMed
        type="subtle"
        title={i18n.sendDebugLog()}
        onPress={sendDebugLog}
      />
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
