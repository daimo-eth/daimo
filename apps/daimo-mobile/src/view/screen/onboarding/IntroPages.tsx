import { DaimoLink, getInvitePasteLink } from "@daimo/common";
import * as Clipboard from "expo-clipboard";
import { ReactNode, useEffect, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ActStatus } from "../../../action/actStatus";
import { DeviceKeyStatus } from "../../../action/key";
import { ButtonBig, TextButton } from "../../shared/Button";
import { InfoLink } from "../../shared/InfoLink";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import { TextCenter, TextError, TextH1 } from "../../shared/text";

export function IntroPages({
  useExistingStatus,
  keyStatus,
  existingNext,
  onNext,
  setInviteLink,
}: {
  useExistingStatus: ActStatus;
  keyStatus: DeviceKeyStatus;
  existingNext: () => void;
  onNext: ({
    choice,
  }: {
    choice: "create" | "existing" | "create-with-invite";
  }) => void;
  setInviteLink: (link?: DaimoLink) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const updatePageBubble = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.round(contentOffset.x / layoutMeasurement.width);
    setPageIndex(page);
  };

  useEffect(() => {
    if (keyStatus.pubKeyHex && useExistingStatus === "success") existingNext();
  }, [useExistingStatus]);

  // Paste invite
  const [pasteLinkError, setPasteLinkError] = useState("");
  const pasteInviteLink = async () => {
    const str = await Clipboard.getStringAsync();
    console.log(`[INTRO] paste invite link: '${str}'`);
    try {
      setInviteLink(getInvitePasteLink(str));
      onNext({ choice: "create-with-invite" });
    } catch (e: any) {
      console.warn(`[INTRO] can't parse invite link: '${str}'`, e.getMessage());
      setPasteLinkError("Copy link & try again.");
    }
  };

  return (
    <View style={styles.onboardingPage}>
      <View style={styles.introPages}>
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
        <Spacer h={32} />
        <View style={styles.introButtonsCenter}>
          <View style={styles.introButtonsWrap}>
            <ButtonBig
              type="primary"
              title="ACCEPT INVITE"
              onPress={pasteInviteLink}
            />
            {pasteLinkError && (
              <TextCenter>
                <Spacer h={8} />
                <TextError>{pasteLinkError}</TextError>
              </TextCenter>
            )}
            <Spacer h={16} />
            <ButtonBig
              type="subtle"
              title="CREATE ACCOUNT"
              onPress={() => {
                onNext({ choice: "create" });
              }}
            />
            <Spacer h={16} />
            <TextButton
              title="ALREADY HAVE AN ACCOUNT?"
              onPress={() => {
                onNext({ choice: "existing" });
              }}
            />
          </View>
        </View>
      </View>
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
