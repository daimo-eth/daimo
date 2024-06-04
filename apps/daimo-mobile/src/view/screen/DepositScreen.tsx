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
  // TODO(andrew): Use landline logo
  const defaultLogo = `${daimoDomainAddress}/assets/deposit/deposit-wallet.png`;

  const openLandline = useCallback(() => {
    if (!account) return;
    Linking.openURL(
      getLandlineURL(account.address, account.landlineSessionKey)
    );
  }, [account?.address, account?.landlineSessionKey]);

  if (account == null) return null;

  return (
    <LandlineOptionRow
      cta="Connect with Landline"
      title="Deposit or withdraw directly from a US bank account"
      logo={defaultLogo}
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

  // const landlineAccounts = account.landlineAccounts;
  const landlineAccounts: LandlineAccount[] = [
    {
      daimoAddress: account.address,
      bankName: "Chase",
      accountName: "TOTAL CHECKING",
      lastFour: "1234",
      liquidationAddress: "0xed2a48c6b6ea72f57252a61d5bf948b6ce8a3240",
      chain: "base",
      destinationCurrency: "usd",
      createdAt: "2024-05-30 11:23:44.274001",
      bankLogo:
        "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",
    },
  ];

  const goToSendTransfer = (landlineAccount: LandlineAccount) => {
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { landlineAccount },
    });
  };

  return (
    <>
      {landlineAccounts.map((acc, idx) => (
        <LandlineOptionRow
          key={`landline-account-${idx}`}
          cta={`${acc.bankName} ****${acc.lastFour}`}
          title={`Connected ${timeAgo(
            new Date(acc.createdAt).getTime() / 1000,
            nowS
          )} ago`}
          // The bank logo is fetched as a base64 string for a png
          logo={{ uri: `data:image/png;base64,${acc.bankLogo}` } || defaultLogo}
          isAccount
          onClick={() => goToSendTransfer(acc)}
        />
      ))}
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
