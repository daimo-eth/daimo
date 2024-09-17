import {
  LandlineAccount,
  PlatformType,
  daimoDomainAddress,
  timeAgo,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import React, { useCallback, useContext, useMemo, useState } from "react";
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

import IconDepositWallet from "../../../../assets/icon-deposit-wallet.png";
import IconWithdrawWallet from "../../../../assets/icon-withdraw-wallet.png";
import LandlineLogo from "../../../../assets/logos/landline-logo.png";
import { DispatcherContext } from "../../../action/dispatch";
import { useNav } from "../../../common/nav";
import { env } from "../../../env";
import { i18NLocale, i18n } from "../../../i18n";
import { useAccount } from "../../../logic/accountManager";
import {
  DaimoContact,
  getContactProfilePicture,
  landlineAccountToContact,
} from "../../../logic/daimoContacts";
import { useTime } from "../../../logic/time";
import { getRpcFunc } from "../../../logic/trpc";
import { Account } from "../../../storage/account";
import { InfoBox } from "../../shared/InfoBox";
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
  return (
    <View style={{ flex: 1 }}>
      <View style={ss.container.padH16}>
        <ScreenHeader title={i18.screenHeader()} />
      </View>
      <ScrollView>
        <LandlineList />
        <Spacer h={24} />
        <DepositList account={account} />
        <Spacer h={16} />
        <WithdrawList account={account} />
      </ScrollView>
    </View>
  );
}

function LandlineList() {
  const account = useAccount();
  if (account == null) return null;
  const showLandline = !!account.landlineSessionURL;
  if (!showLandline) return null;

  const isLandlineConnected = account.landlineAccounts.length > 0;

  return isLandlineConnected ? <LandlineAccountList /> : <LandlineConnect />;
}

function LandlineConnect() {
  const account = useAccount();

  const openLandline = useCallback(() => {
    if (!account) return;
    Linking.openURL(account.landlineSessionURL);
  }, [account?.landlineSessionURL]);

  if (account == null) return null;

  return (
    <LandlineOptionRow
      cta={i18.landline.cta()}
      title={i18.landline.title()}
      logo={LandlineLogo}
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
            title={i18.landline.optionRowTitle(
              timeAgo(accCreatedAtS, i18NLocale, nowS)
            )}
            cta={`${acc.bankName} ****${acc.accountNumberLastFour}`}
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
// Binance is the only on-demand exchange for now because generated links
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
      cta: i18.binance.cta(),
      title: i18.binance.title(),
      logo: {
        uri: `${daimoDomainAddress}/assets/deposit/binance.png`,
      },
      loadingId: progressId,
      isExternal: true,
      sortId: 2,
      onClick,
    },
  ];
}

type Progress = "idle" | "loading-binance-deposit" | "started";

function DepositList({ account }: { account: Account }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
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
      cta: i18.default.cta(),
      title: i18.default.title(),
      logo: defaultLogo,
      sortId: 100, // Standin for infinite
      onClick: openAddressDeposit,
    },
  ];

  if (!isTestnet) {
    options.push(
      ...account.recommendedExchanges.map((rec) => ({
        title: rec.title || i18.loading(),
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
            title={i18.initiated.title()}
            subtitle={i18.initiated.subtitle()}
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
  const { color, touchHighlightUnderlay, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
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
          <TextBody color={color.primary}>
            {i18.landline.startTransfer()}
          </TextBody>
        ) : (
          <TextBody color={color.primary}>
            {i18.go()}
            {"  "}
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
