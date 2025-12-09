import { daimoDomainAddress } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import React, { useContext, useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
  useWindowDimensions,
} from "react-native";

import { DaimoPayWebView } from "./DaimoPayWebView";
import IconDepositWallet from "../../../../assets/icon-deposit-wallet.png";
import IconWithdrawWallet from "../../../../assets/icon-withdraw-wallet.png";
import { DispatcherContext } from "../../../action/dispatch";
import { useNav } from "../../../common/nav";
import { env } from "../../../env";
import { i18n } from "../../../i18n";
import { Account } from "../../../storage/account";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { TextBody, TextMeta } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { Colorway, SkinStyleSheet } from "../../style/skins";
import { useTheme } from "../../style/theme";

const i18 = i18n.deposit;

export default function DepositScreen() {
  const Inner = useWithAccount(DepositScreenInner);
  return <Inner />;
}

// maybe is in here is the problem?
function DepositScreenInner({ account }: { account: Account }) {
  const { ss } = useTheme();
  const [showDaimoPay, setShowDaimoPay] = useState(false);
  const nav = useNav();

  // Automatically close Daimo Pay webview when the user navigates away.
  useEffect(() => {
    const unsubscribe = nav.addListener("blur", () => setShowDaimoPay(false));
    return unsubscribe;
  }, [nav]);

  return (
    <View style={{ flex: 1 }}>
      <View style={ss.container.padH16}>
        <ScreenHeader title={i18.screenHeader()} />
      </View>
      <ScrollView>
        <Spacer h={24} />
        <DepositList account={account} setShowDaimoPay={setShowDaimoPay} />
        <Spacer h={16} />
        <WithdrawList account={account} />
      </ScrollView>

      <DaimoPayWebView
        account={account}
        visible={showDaimoPay}
        onClose={() => setShowDaimoPay(false)}
      />
    </View>
  );
}

type Progress = "idle" | "loading-binance-deposit" | "started";

function DepositList({
  account,
  setShowDaimoPay,
}: {
  account: Account;
  setShowDaimoPay: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const { chainConfig } = env(daimoChainFromId(account.homeChainId));
  const isTestnet = chainConfig.chainL2.testnet;

  const dispatcher = useContext(DispatcherContext);

  const openAddressDeposit = () => {
    dispatcher.dispatch({ name: "depositAddress" });
  };

  const defaultLogo = IconDepositWallet;

  const options: OptionRowProps[] = [
    {
      cta: i18.default.cta(),
      title: i18.default.title(),
      logo: defaultLogo,
      sortId: 100, // Standin for infinite
      onClick: openAddressDeposit,
    },
  ];

  if (!isTestnet) {
    options.push({
      cta: "Deposit with Daimo Pay",
      title: "Daimo Pay",
      logo: { uri: "https://pay.daimo.com/daimo-pay-logo.svg" },
      sortId: 1,
      onClick: () => {
        setShowDaimoPay(true);
      },
    });
  }

  return (
    <View style={styles.section}>
      <TextBody color={color.gray3}>Deposit</TextBody>
      <Spacer h={16} />
      {options.map((option) => (
        <OptionRow key={option.cta} progress="idle" {...option} />
      ))}
    </View>
  );
}

function WithdrawList({ account }: { account: Account }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const { chainConfig } = env(daimoChainFromId(account.homeChainId));
  const dispatcher = useContext(DispatcherContext);
  const nav = useNav();

  const openAddressWithdraw = () => {
    dispatcher.dispatch({ name: "withdrawInstructions" });
  };

  const defaultLogo = IconWithdrawWallet;
  const isTestnet = chainConfig.chainL2.testnet;

  const openBitrefill = () => {
    nav.navigate("DepositTab", {
      screen: "BitrefillWebView",
    });
  };

  return (
    <View style={styles.section}>
      <TextBody color={color.gray3}>{i18.withdraw.cta()}</TextBody>
      <Spacer h={16} />
      <OptionRow
        cta={i18.withdraw.cta()}
        title={i18.withdraw.title()}
        logo={defaultLogo}
        onClick={openAddressWithdraw}
      />
      {!isTestnet && (
        <OptionRow
          cta={i18.bitrefill.cta()}
          title={i18.bitrefill.title()}
          logo={{ uri: `${daimoDomainAddress}/assets/deposit/bitrefill.png` }}
          onClick={openBitrefill}
        />
      )}
    </View>
  );
}

type OptionRowProps = {
  title?: string;
  cta: string;
  logo: ImageSourcePropType;
  isExternal?: boolean;
  loadingId?: string;
  progress?: Progress;
  sortId?: number;
  onClick: () => void | Promise<void>;
};

function OptionRow({
  title,
  cta,
  logo,
  isExternal,
  loadingId,
  onClick,
  progress,
}: OptionRowProps) {
  const { color, touchHighlightUnderlay, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const width = useWindowDimensions().width;

  const rightContent = (() => {
    if (progress && progress === loadingId)
      return <ActivityIndicator size="small" />;
    if (isExternal) {
      return (
        <TextBody color={color.primary}>
          {i18.go()} <Octicons name="link-external" />
        </TextBody>
      );
    } else {
      return <TextBody color={color.primary}>{i18.continue()}</TextBody>;
    }
  })();

  return (
    <TouchableHighlight
      onPress={onClick}
      {...touchHighlightUnderlay.subtle}
      style={{ marginHorizontal: -16 }}
    >
      <View style={styles.optionRow}>
        <View style={{ ...styles.optionRowLeft, maxWidth: width - 160 }}>
          <LogoBubble logo={logo} />
          <View style={{ flexDirection: "column" }}>
            <TextBody color={color.midnight}>{cta}</TextBody>
            <Spacer h={2} />
            <TextMeta color={color.gray3}>{title}</TextMeta>
          </View>
        </View>
        <View style={styles.optionRowRight}>{rightContent}</View>
      </View>
    </TouchableHighlight>
  );
}

function LogoBubble({ logo }: { logo: ImageSourcePropType }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  return (
    <View style={styles.logoBubble}>
      <Image source={logo} style={styles.logoBubble} />
    </View>
  );
}

const getStyles = (color: Colorway, ss: SkinStyleSheet) =>
  StyleSheet.create({
    optionRow: {
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderColor: color.grayLight,
      marginHorizontal: 16,
    },
    optionRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    optionRowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    rowUnderlayWrap: {
      marginHorizontal: -16,
    },
    logoBubble: {
      width: 36,
      height: 36,
      borderRadius: 99,
    },
    section: {
      marginHorizontal: 16,
      borderBottomWidth: 1,
      borderColor: color.grayLight,
    },
    checklistAction: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.grayLight,
      marginHorizontal: 24,
      backgroundColor: color.white,
      ...ss.container.shadow,
      elevation: 0, // Android shadows are bugged with Pressable: https://github.com/facebook/react-native/issues/25093#issuecomment-789502424
    },
  });
