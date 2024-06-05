import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import React, { useContext, useState } from "react";
import {
  ImageSourcePropType,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
  useWindowDimensions,
} from "react-native";

import IconDepositWallet from "../../../assets/icon-deposit-wallet.png";
import IconWithdrawWallet from "../../../assets/icon-withdraw-wallet.png";
import { DispatcherContext } from "../../action/dispatch";
import { env } from "../../logic/env";
import { Account } from "../../model/account";
import { CoverGraphic } from "../shared/CoverGraphic";
import { InfoBox } from "../shared/InfoBox";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextMeta } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export default function DepositScreen() {
  const Inner = useWithAccount(DepositScreenInner);
  return <Inner />;
}

function DepositScreenInner({ account }: { account: Account }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={ss.container.padH16}>
        <ScreenHeader title="Deposit or Withdraw" />
      </View>
      <ScrollView>
        <CoverGraphic type="deposit" />
        <Spacer h={8} />
        <DepositList account={account} />
        <Spacer h={16} />
        <WithdrawList />
      </ScrollView>
    </View>
  );
}

function DepositList({ account }: { account: Account }) {
  const { chainConfig } = env(daimoChainFromId(account.homeChainId));
  const isTestnet = chainConfig.chainL2.testnet;

  const [started, setStarted] = useState(false);

  const openExchange = (url: string) => {
    Linking.openURL(url);
    setStarted(true);
  };

  const dispatcher = useContext(DispatcherContext);

  const openAddressDeposit = () => {
    dispatcher.dispatch({ name: "depositAddress" });
  };

  const defaultLogo = IconDepositWallet;

  const options: OptionRowProps[] = [
    {
      cta: "Deposit to address",
      title: "Send to your address",
      logo: defaultLogo,
      onClick: openAddressDeposit,
    },
  ];

  if (!isTestnet) {
    options.unshift(
      ...account.recommendedExchanges.map((rec) => ({
        title: rec.title || "Loading...",
        cta: rec.cta,
        logo: rec.logo || defaultLogo,
        isExternal: true,
        onClick: () => openExchange(rec.url),
      }))
    );
  }

  return (
    <View style={styles.section}>
      <TextBody color={color.gray3}>Deposit</TextBody>
      {started && (
        <>
          <Spacer h={16} />
          <InfoBox
            icon="check"
            title="Deposit initiated"
            subtitle="Complete in browser, then funds should arrive in a few minutes."
          />
        </>
      )}
      <Spacer h={16} />
      {options.map((option) => (
        <OptionRow key={option.cta} {...option} />
      ))}
    </View>
  );
}

function WithdrawList() {
  const dispatcher = useContext(DispatcherContext);

  const openAddressWithdraw = () => {
    dispatcher.dispatch({ name: "withdrawInstructions" });
  };

  const defaultLogo = IconWithdrawWallet;

  return (
    <View style={styles.section}>
      <TextBody color={color.gray3}>Withdraw</TextBody>
      <Spacer h={16} />
      <OptionRow
        cta="Withdraw"
        title="Withdraw to any wallet or exchange"
        logo={defaultLogo}
        onClick={openAddressWithdraw}
      />
    </View>
  );
}

type OptionRowProps = {
  title?: string;
  cta: string;
  logo: ImageSourcePropType;
  isExternal?: boolean;
  onClick: () => void;
};

function OptionRow({ title, cta, logo, isExternal, onClick }: OptionRowProps) {
  const width = useWindowDimensions().width;

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
        <View style={styles.optionRowRight}>
          {isExternal ? (
            <TextBody color={color.primary}>
              Go{"  "}
              <Octicons name="link-external" />
            </TextBody>
          ) : (
            <TextBody color={color.primary}>Continue</TextBody>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
}

function LogoBubble({ logo }: { logo: ImageSourcePropType }) {
  return (
    <View style={styles.logoBubble}>
      <Image source={logo} style={styles.logoBubble} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
