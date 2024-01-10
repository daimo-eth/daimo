import { ReactNode, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  StyleSheet,
} from "react-native";

import { ButtonBig, TextButton } from "../../shared/Button";
import { InfoLink } from "../../shared/InfoLink";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import { TextCenter, TextH1 } from "../../shared/text";

export function IntroPages({
  onNext,
}: {
  onNext: ({ choice }: { choice: "create" | "existing" }) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const updatePageBubble = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.round(contentOffset.x / layoutMeasurement.width);
    setPageIndex(page);
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
              title="Create Account"
              onPress={() => {
                onNext({ choice: "create" });
              }}
            />
            <Spacer h={16} />
            <TextButton
              title="Already have an account?"
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
      Daimo is a global payments app that runs on Ethereum. Send and receive
      USDC on Base mainnet.
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
