import { debugJson } from "@daimo/common";
import * as Clipboard from "expo-clipboard";
import React, { ReactNode, useEffect, useMemo } from "react";
import {
  Image,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import OnboardingCoverMicro from "../../../../assets/onboarding/intro-cover-micro.png";
import OnboardingCover from "../../../../assets/onboarding/intro-cover.png";
import IntroIconEverywhere from "../../../../assets/onboarding/intro-icon-everywhere.png";
import IntroIconOnEthereum from "../../../../assets/onboarding/intro-icon-on-ethereum.png";
import IntroIconYourKeys from "../../../../assets/onboarding/intro-icon-your-keys.png";
import {
  handleOnboardingDeepLink,
  useOnboardingNav,
} from "../../../common/nav";
import { i18n } from "../../../i18n";
import {
  getAccountManager,
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import { ButtonBig, HelpButton, TextButton } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import {
  TextBody,
  TextH1,
  TextH3,
  TextLight,
  TextLink,
} from "../../shared/text";
import { Colorway } from "../../style/skins";
import { useTheme } from "../../style/theme";

const isAndroid = Platform.OS === "android";
const i18 = i18n.onboardingIntro;

export function OnboardingIntroScreen() {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const dc = useDaimoChain();
  const nav = useOnboardingNav();

  // Create new enclave key in background if we don't have one.
  const { keyInfo } = useAccountAndKeyInfo();
  const pubKeyHex = keyInfo?.pubKeyHex;
  useEffect(() => {
    if (keyInfo == null || pubKeyHex != null) return;
    console.log(`[ONBOARDING] create enclave key`);
    getAccountManager().createNewEnclaveKey();
  }, [pubKeyHex]);

  // User clicks ACCEPT INVITE > pastes invite link
  const pasteInviteLink = async () => {
    const str = await Clipboard.getStringAsync();
    return handleOnboardingDeepLink(dc, nav, str);
  };

  const goToUseExisting = () => {
    if (isAndroid) nav.navigate("ExistingSetupKey");
    else nav.navigate("Existing");
  };

  const dims = useSafeAreaFrame();
  const isCompact = dims.height < 850;
  const isMicro = dims.height < 800;
  console.log(`[ONBOARDING] render intro, ${debugJson({ dims, isCompact })}`);

  return (
    <SafeAreaView style={styles.onboardingPage}>
      <View style={styles.onboardingPageTop}>
        <Spacer h={isCompact ? 24 : 32} />
        <TextH1 color={color.midnight}>{i18.title()}</TextH1>
        <Spacer h={4} />
        <TextH3 color={color.gray3}>{i18.subtitle()}</TextH3>
        <Spacer h={16} />
        <View style={{ display: "flex", alignItems: "center" }}>
          <Image
            source={isMicro ? OnboardingCoverMicro : OnboardingCover}
            style={
              isMicro
                ? { width: 256, height: 170 }
                : { width: 302, height: 266 }
            }
          />
        </View>
        <Spacer h={isCompact ? 24 : 32} />
        <IntroRows />
      </View>
      <View style={styles.introButtonsCenter}>
        <View style={styles.introButtonsWrap}>
          <ButtonBig
            type="primary"
            title={i18.acceptInviteButton()}
            onPress={pasteInviteLink}
          />
          <Spacer h={16} />
          <TextButton
            title={i18.alreadyHaveAccountButton()}
            onPress={goToUseExisting}
          />
          <Spacer h={16} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const icons = {
  "intro-your-keys": IntroIconYourKeys,
  "intro-everywhere": IntroIconEverywhere,
  "intro-on-ethereum": IntroIconOnEthereum,
};

function IntroRows() {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  return (
    <View style={styles.introRows}>
      <IntroRow icon="intro-your-keys" title={i18.rows.selfCustody.title()}>
        <TextBody color={color.gray3}>
          {i18.rows.selfCustody.description()}
        </TextBody>
        <HelpButton
          title={i18.rows.help.button()}
          helpTitle={i18.rows.help.description()}
          helpContent={<HelpModalUSDC />}
        />
      </IntroRow>
      <Spacer h={16} />
      <IntroRow icon="intro-everywhere" title={i18.rows.everywhere.title()}>
        <TextBody color={color.gray3}>
          {i18.rows.everywhere.description()}
        </TextBody>
      </IntroRow>
      <Spacer h={16} />
      <IntroRow icon="intro-on-ethereum" title={i18.rows.onEthereum.title()}>
        <TextBody color={color.gray3}>
          {i18.rows.onEthereum.description()}
        </TextBody>
      </IntroRow>
    </View>
  );
}

function IntroRow({
  icon,
  title,
  children,
}: {
  icon: keyof typeof icons;
  title: string;
  children: ReactNode;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  return (
    <View style={styles.introRow}>
      <View style={styles.introRowIcon}>
        <Image source={icons[icon]} style={styles.introRowIconImage} />
      </View>
      <View style={styles.introRowContent}>
        <TextBody color={color.midnight}>{title}</TextBody>
        <Spacer h={4} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {children}
        </View>
      </View>
    </View>
  );
}

function HelpModalUSDC() {
  return (
    <View>
      <TextLight>{i18.helpModalUSDC.description()}</TextLight>
      <Spacer h={24} />
      <TextLight>
        {i18.helpModalUSDC.learnMore()}{" "}
        <TextLink
          onPress={() => Linking.openURL("https://www.circle.com/en/usdc")}
        >
          {i18.helpModalUSDC.here()}
        </TextLink>
        .
      </TextLight>
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    onboardingPage: {
      display: "flex",
      justifyContent: "space-between",
      flexGrow: 1,
    },
    onboardingPageTop: {
      display: "flex",
      alignItems: "center",
    },
    introButtonsCenter: {
      paddingHorizontal: 24,
      alignSelf: "stretch",
      flexDirection: "row",
      justifyContent: "center",
    },
    introButtonsWrap: {
      flexGrow: 1,
      maxWidth: 480,
    },
    introRows: {
      shadowColor: color.white,
      flexGrow: 1,
      paddingHorizontal: 24,
    },
    introRow: {
      flexDirection: "row",
    },
    introRowIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: color.grayLight,
      marginRight: 16,
    },
    introRowIconImage: {
      width: 32,
      height: 32,
    },
    introRowContent: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  });
