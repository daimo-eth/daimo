import { StatusBar } from "expo-status-bar";
import { useCallback, useContext, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAccount } from "../../logic/account";
import { ChainContext } from "../../logic/chain";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import Spacer from "../shared/Spacer";

export default function OnboardingScreen() {
  const { chain } = useContext(ChainContext);

  const [pageIndex, setPageIndex] = useState(0);
  const updatePageBubble = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.round(contentOffset.x / layoutMeasurement.width);
    setPageIndex(page);
  };

  const [account, setAccount] = useAccount();
  const createAccount = useCallback(async () => {
    const account = await chain.createAccount();
    setAccount(account);
  }, [account]);

  return (
    <View style={styles.outerView}>
      <View style={styles.centerView}>
        <PageBubble count={4} index={pageIndex} />
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.introPageScroll}
          onScroll={updatePageBubble}
          scrollEventThrottle={32}
        >
          <IntroPage
            title="Welcome to Daimo"
            body="Thanks for testing our alpha release. Daimo is experimental
            technology. Use at your own risk."
          />
          <IntroPage
            title="USDC"
            body="Daimo lets you send and receive money using the USDC stablecoin.
            1 USDC is $1. Learn how it works here."
          />
          <IntroPage
            title="Yours alone"
            body="Daimo stores money via cryptographic secrets. There's no bank.
            To protect your funds in case you lose your phone, you can add
            additional devices."
          />
          <IntroPage
            title="On Ethereum"
            body="Daimo runs on Base, an Ethereum rollup. This lets you send
            money securely, anywhere in the world, quickly, and at low cost."
          />
        </ScrollView>
        <Spacer h={64} />
        <ButtonBig title="Create Account" onPress={createAccount} />
        <Spacer h={8} />
        <ButtonSmall title="Use existing" />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

function IntroPage({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.introPage}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
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
          backgroundColor: i === index ? "#000" : "#ccc",
          margin: 4,
        }}
      />
    );
  }
  return <View style={{ flexDirection: "row" }}>{bubbles}</View>;
}

const screenDimensions = Dimensions.get("screen");

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  centerView: {
    alignItems: "center",
  },
  introPageScroll: {
    flexBasis: 256,
    flexGrow: 0,
  },
  introPage: {
    width: screenDimensions.width,
    gap: 32,
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  body: {
    fontSize: 18,
    width: "100%",
    textAlign: "center",
  },
});
