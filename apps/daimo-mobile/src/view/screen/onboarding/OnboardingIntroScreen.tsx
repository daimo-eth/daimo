import { parseInviteCodeOrLink } from "@daimo/common";
import * as Clipboard from "expo-clipboard";
import { ReactNode, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { getInviteLinkStatus } from "./OnboardingEnterInviteScreen";
import { useOnboardingNav } from "../../../common/nav";
import { ButtonBig, TextButton } from "../../shared/Button";
import { InfoLink } from "../../shared/InfoLink";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import { TextCenter, TextH1 } from "../../shared/text";

const isAndroid = Platform.OS === "android";
export function OnboardingIntroScreen() {
  const nav = useOnboardingNav();
  const pasteInviteLink = async () => {
    const str = await Clipboard.getStringAsync();
    const inviteLink = parseInviteCodeOrLink(str);
    console.log(`[INTRO] paste invite link: '${str}'`);
    if (inviteLink && (await getInviteLinkStatus(inviteLink))?.isValid) {
      if (isAndroid) nav.navigate("CreateSetupKey", { inviteLink });
      else nav.navigate("CreatePickName", { inviteLink });
    } else {
      nav.navigate("CreateNew");
    }
  };

  const goToUseExisting = () => {
    if (isAndroid) nav.navigate("ExistingSetupKey");
    else nav.navigate("UseExisting");
  };

  return (
    <View style={styles.onboardingPage}>
      <View style={styles.introPages}>
        <IntroPageSwiper />
        <View style={styles.introButtonsCenter}>
          <View style={styles.introButtonsWrap}>
            <Spacer h={32} />
            <ButtonBig
              type="primary"
              title="ACCEPT INVITE"
              onPress={pasteInviteLink}
            />
            <Spacer h={16} />
            <TextButton
              title="ALREADY HAVE AN ACCOUNT?"
              onPress={goToUseExisting}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function IntroPageSwiper() {
  const [pageIndex, setPageIndex] = useState(0);
  const updatePageBubble = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.round(contentOffset.x / layoutMeasurement.width);
    setPageIndex(page);
  };

  return (
    <View>
      <PageBubble count={4} index={pageIndex} />
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.introPageScroll}
        onScroll={updatePageBubble}
        scrollEventThrottle={32}
        contentContainerStyle={{ width: `${introPages.length * 100}%` }}
      >
        {introPages.map((page, i) => (
          <View style={{ width: `${100 / introPages.length}%` }} key={i}>
            {page}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const tokenSymbol = "USDC";
const introPages = [
  <IntroPage title="Welcome to Daimo">
    <IntroTextParagraph>
      Daimo is a global payments app that runs on Ethereum.
    </IntroTextParagraph>
  </IntroPage>,
  <IntroPage title={tokenSymbol}>
    <IntroTextParagraph>
      You can send and receive money using the {tokenSymbol} stablecoin. 1{" "}
      {tokenSymbol} is $1.
    </IntroTextParagraph>
    <View style={ss.container.marginHNeg16}>
      <InfoLink
        url="https://www.circle.com/en/usdc"
        title="Learn how it works here"
      />
    </View>
  </IntroPage>,
  <IntroPage title="Yours alone">
    <IntroTextParagraph>
      Daimo stores money via cryptographic secrets. There's no bank.
    </IntroTextParagraph>
  </IntroPage>,
  <IntroPage title="On Ethereum">
    <IntroTextParagraph>
      Daimo runs on Base, an Ethereum rollup. This lets you send money securely,
      anywhere in the world.
    </IntroTextParagraph>
  </IntroPage>,
];

function IntroPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.introPage}>
      <TextCenter>
        <TextH1>{title}</TextH1>
      </TextCenter>
      <Spacer h={32} />
      {children}
    </View>
  );
}

function PageBubble({ count, index }: { count: number; index: number }) {
  const bubbles = [];
  for (let i = 0; i < count; i++) {
    bubbles.push(
      <View
        key={i}
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: i === index ? color.midnight : color.grayLight,
          margin: 4,
        }}
      />
    );
  }
  return (
    <View style={{ flexDirection: "row", justifyContent: "center" }}>
      {bubbles}
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingPage: {
    flex: 1,
    justifyContent: "space-between",
  },
  introPages: {
    flex: 1,
    backgroundColor: color.white,
    alignItems: "stretch",
    justifyContent: "center",
  },
  introPageScroll: {
    flexGrow: 0,
  },
  introPage: {
    padding: 32,
    maxWidth: 480,
    alignSelf: "center",
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
});
