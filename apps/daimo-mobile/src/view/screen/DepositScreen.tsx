import { LandlineAccount } from "@daimo/api/src/landline/connector";
import { PlatformType, daimoDomainAddress, timeAgo } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  ImageSourcePropType,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
  useWindowDimensions,
} from "react-native";

import IconDepositWallet from "../../../assets/icon-deposit-wallet.png";
import IconWithdrawWallet from "../../../assets/icon-withdraw-wallet.png";
import IntroIconEverywhere from "../../../assets/onboarding/intro-icon-everywhere.png";
import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { env } from "../../env";
import { useAccount } from "../../logic/accountManager";
import {
  DaimoContact,
  getContactProfilePicture,
  landlineAccountToContact,
} from "../../logic/daimoContacts";
import { useTime } from "../../logic/time";
import { getRpcFunc } from "../../logic/trpc";
import { Account } from "../../storage/account";
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

  if (account == null) return null;

  const landlineAccounts = account.landlineAccounts;

  const goToSendTransfer = (landlineAccount: LandlineAccount) => {
    const recipient = landlineAccountToContact(landlineAccount);
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { recipient },
    });
  };

  return (
    <>
      {landlineAccounts.map((acc, idx) => {
        const accCreatedAtS = new Date(acc.createdAt).getTime() / 1000;
        const recipient = landlineAccountToContact(acc) as DaimoContact;
        return (
          <LandlineOptionRow
            key={`landline-account-${idx}`}
            cta={`${acc.bankName} ****${acc.lastFour}`}
            title={`Connected ${timeAgo(accCreatedAtS, nowS)} ago`}
            logo={getContactProfilePicture(recipient) as ImageSourcePropType}
            isAccount
            onClick={() => goToSendTransfer(acc)}
          />
        );
      })}
    </>
  );
}

// An on-demand exchange is one that requires fetching a URL at the time of
// user's interaction, rather than have it pre-fetched. These exchanges are
// first fetched with a loading spinner, then the URL is opened.
// Binance is the only on-demand exchange for now becuase generated links
// expire quickly and 301 redirects don't work for opening universal links
// in Binance app, so we can't include it in the recommendedExchanges API-side.
function getOnDemandExchanges(
  account: Account,
  setProgress: (progress: Progress) => void
) {
  const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));

  const platform = ["ios", "android"].includes(Platform.OS)
    ? (Platform.OS as PlatformType)
    : "other";

  if (platform === "other") {
    return [];
  }

  const progressId = "loading-binance-deposit";

  const onClick = async () => {
    setProgress(progressId);
    const url = await rpcFunc.getExchangeURL.query({
      addr: account.address,
      platform,
      exchange: "binance",
      direction: "depositFromExchange",
    });

    if (url == null) {
      console.error(`[DEPOSIT] no binance url for ${account.name}`);
      setProgress("idle");
    } else {
      Linking.openURL(url);
      setProgress("started");
    }
  };

  return [
    {
      cta: "Deposit from Binance",
      title: "Send from Binance balance",
      logo: `${daimoDomainAddress}/assets/deposit/binance.png` as any,
      loadingId: progressId,
      isExternal: true,
      sortId: 2,
      onClick,
    },
  ];
}

type Progress = "idle" | "loading-binance-deposit" | "started";

function DepositList({ account }: { account: Account }) {
  const { chainConfig } = env(daimoChainFromId(account.homeChainId));
  const isTestnet = chainConfig.chainL2.testnet;

  const [progress, setProgress] = useState<Progress>("idle");

  const openExchange = (url: string) => {
    Linking.openURL(url);
    setProgress("started");
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
      sortId: 100, // Standin for infinite
      onClick: openAddressDeposit,
    },
  ];

  if (!isTestnet) {
    options.push(
      ...account.recommendedExchanges.map((rec) => ({
        title: rec.title || "Loading...",
        cta: rec.cta,
        logo: rec.logo || defaultLogo,
        isExternal: true,
        sortId: rec.sortId || 0,
        onClick: () => openExchange(rec.url),
      })),
      ...getOnDemandExchanges(account, setProgress)
    );
    options.sort((a, b) => (a.sortId || 0) - (b.sortId || 0));
  }

  return (
    <View style={styles.section}>
      <TextBody color={color.gray3}>Deposit</TextBody>
      {progress === "started" && (
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
        <OptionRow key={option.cta} progress={progress} {...option} />
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

type LandlineOptionRowProps = {
  title: string;
  cta: string;
  logo: ImageSourcePropType;
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
  const width = useWindowDimensions().width;

  const rightContent = (() => {
    if (progress && progress === loadingId)
      return <ActivityIndicator size="small" />;
    if (isExternal) {
      return (
        <TextBody color={color.primary}>
          Go{"  "}
          <Octicons name="link-external" />
        </TextBody>
      );
    } else {
      return <TextBody color={color.primary}>Continue</TextBody>;
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
