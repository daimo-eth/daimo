import { LandlineAccount } from "@daimo/api/src/landline/connector";
import { daimoDomainAddress, timeAgo } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import React, { useCallback, useContext, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
  useWindowDimensions,
} from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { useAccount } from "../../logic/accountManager";
import { env } from "../../logic/env";
import { useTime } from "../../logic/time";
import { Account } from "../../model/account";
import { CoverGraphic } from "../shared/CoverGraphic";
import { InfoBox } from "../shared/InfoBox";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextMeta } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";
import IntroIconEverywhere from "../../../assets/onboarding/intro-icon-everywhere.png";

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
        <Spacer h={16} />
        <LandlineList />
        <Spacer h={24} />
        <DepositList account={account} />
        <Spacer h={16} />
        <WithdrawList />
      </ScrollView>
    </View>
  );
}

const getLandlineURL = (daimoAddress: string, sessionKey: string) => {
  const landlineDomain = process.env.LANDLINE_DOMAIN;
  return `${landlineDomain}?daimoAddress=${daimoAddress}&sessionKey=${sessionKey}`;
};

function LandlineList() {
  const account = useAccount();
  if (account == null) return null;
  const showLandline =
    !!account.landlineSessionKey && !!process.env.LANDLINE_DOMAIN;
  if (!showLandline) return null;

  const isLandlineConnected = account.landlineAccounts.length > 0;

  return isLandlineConnected ? <LandlineAccountList /> : <LandlineConnect />;
}

function LandlineConnect() {
  const account = useAccount();

  const openLandline = useCallback(() => {
    if (!account) return;
    Linking.openURL(
      getLandlineURL(account.address, account.landlineSessionKey),
    );
  }, [account?.address, account?.landlineSessionKey]);

  if (account == null) return null;

  return (
    <LandlineOptionRow
      cta="Connect with Landline"
      title="Deposit or withdraw directly from a US bank account"
      // TODO(andrew): Update with real landline logo
      logo={IntroIconEverywhere}
      onClick={openLandline}
    />
  );
}

function LandlineAccountList() {
  const account = useAccount();
  const nav = useNav();
  const nowS = useTime();
  // TODO(andrew): Use bank logo
  const defaultLogo = `${daimoDomainAddress}/assets/deposit/deposit-wallet.png`;

  if (account == null) return null;

  const landlineAccounts = account.landlineAccounts;

  const goToSendTransfer = (landlineAccount: LandlineAccount) => {
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { landlineAccount },
    });
  };

  return (
    <>
      {landlineAccounts.map((acc, idx) => {
        const accCreatedAtS = new Date(acc.createdAt).getTime() / 1000;
        return (
          <LandlineOptionRow
            key={`landline-account-${idx}`}
            cta={`${acc.bankName} ****${acc.lastFour}`}
            title={`Connected ${timeAgo(accCreatedAtS, nowS)} ago`}
            // The bank logo is fetched as a base64 string for a png
            logo={
              { uri: `data:image/png;base64,${acc.bankLogo}` } || defaultLogo
            }
            isAccount
            onClick={() => goToSendTransfer(acc)}
          />
        );
      })}
    </>
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

  const defaultLogo = `${daimoDomainAddress}/assets/deposit/deposit-wallet.png`;

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
      })),
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

  const defaultLogo = `${daimoDomainAddress}/assets/deposit/withdraw-wallet.png`;

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

type LandlineOptionRowProps = {
  title: string;
  cta: string;
  logo: { uri: string } | string;
  isAccount?: boolean;
  onClick: () => void;
};

function LandlineOptionRow({
  title,
  cta,
  logo,
  isAccount,
  onClick,
}: LandlineOptionRowProps) {
  const width = useWindowDimensions().width;

  return (
    <Pressable
      onPress={onClick}
      style={({ pressed }) => [
        {
          ...styles.checklistAction,
          backgroundColor: pressed
            ? touchHighlightUnderlay.subtle.underlayColor
            : undefined,
        },
      ]}
    >
      <View style={{ ...styles.optionRowLeft, maxWidth: width - 200 }}>
        <LogoBubble logo={logo} />
        <View style={{ flexDirection: "column" }}>
          <TextBody color={color.midnight}>{cta}</TextBody>
          <Spacer h={2} />
          <TextMeta color={color.gray3}>{title}</TextMeta>
        </View>
      </View>
      <View style={styles.optionRowRight}>
        {isAccount ? (
          <TextBody color={color.primary}>Start transfer</TextBody>
        ) : (
          <TextBody color={color.primary}>
            Go{"  "}
            <Octicons name="link-external" />
          </TextBody>
        )}
      </View>
    </Pressable>
  );
}

type OptionRowProps = {
  title?: string;
  cta: string;
  logo: string;
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

function LogoBubble({ logo }: { logo: { uri: string } | string }) {
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
