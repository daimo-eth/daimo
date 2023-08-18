import { useCallback, useRef } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { HistoryList } from "./History";
import { useWarmCache } from "../../action/useSendAsync";
import { Account, useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { Button, buttonStyles } from "../shared/Button";
import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { color, ss } from "../shared/style";

export default function HomeScreen() {
  const [account] = useAccount();
  console.log(
    `[HOME] rendering with account ${account?.name}, ${account?.recentTransfers?.length} ops`
  );

  useWarmCache(account?.enclaveKeyName, account?.address);

  const nav = useNav();

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // event.
    const { contentOffset } = event.nativeEvent;
    if (contentOffset.y > 32) {
      // Show full-screen history
      nav.navigate("History");
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const onScrollEnd = () => {
    if (scrollViewRef.current == null) return;
    scrollViewRef.current.scrollTo({ y: 0, animated: true });
  };

  if (account == null) return null;

  return (
    <View style={ss.container.outerStretchScroll}>
      <Header />

      <AmountAndButtons account={account} />

      <ScrollView
        style={styles.historyScroll}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={32}
        ref={scrollViewRef}
      >
        <View style={styles.historyElem}>
          <ScrollPellet />
          <HistoryList account={account} maxToShow={5} />
        </View>
      </ScrollView>
    </View>
  );
}

function AmountAndButtons({ account }: { account: Account }) {
  const nav = useNav();
  const goSend = useCallback(() => nav.navigate("Send"), [nav]);
  const goRequest = useCallback(() => nav.navigate("Request"), [nav]);
  const goDeposit = useCallback(() => nav.navigate("Deposit"), [nav]);
  const goWithdraw = useCallback(() => nav.navigate("Withdraw"), [nav]);

  return (
    <View style={styles.amountAndButtons}>
      <TitleAmount amount={account.lastBalance} />
      <Spacer h={32} />
      <View style={styles.buttonRow}>
        <Button
          style={bigButton}
          title="Send"
          onPress={goSend}
          disabled={account.lastBalance === 0n}
        />
        <Button style={bigButton} title="Request" onPress={goRequest} />
      </View>
      <Spacer h={8} />
      <View style={styles.buttonRow}>
        <Button
          style={smallButton}
          title="Withdraw"
          onPress={goWithdraw}
          disabled={account.lastBalance === 0n}
        />
        <Button style={smallButton} title="Deposit" onPress={goDeposit} />
      </View>
    </View>
  );
}

function ScrollPellet() {
  return (
    <View style={styles.scrollPelletRow}>
      <View style={styles.scrollPellet} />
    </View>
  );
}

const screenDimensions = Dimensions.get("screen");

const styles = StyleSheet.create({
  amountAndButtons: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 400,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 24,
  },
  historyScroll: {
    paddingTop: 32,
  },
  historyElem: {
    backgroundColor: color.white,
    minHeight: screenDimensions.height,
  },
  scrollPelletRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
  },
  scrollPellet: {
    backgroundColor: color.bg.midGray,
    width: 96,
    height: 4,
    borderRadius: 2,
  },
});

const bigButton = StyleSheet.create({
  button: {
    ...buttonStyles.big.button,
    width: 128,
    backgroundColor: color.primary,
  },
  title: {
    ...buttonStyles.big.title,
    color: color.white,
  },
});

const smallButton = StyleSheet.create({
  button: {
    ...buttonStyles.small.button,
    width: 128,
    height: 48,
    justifyContent: "center",
  },
  title: buttonStyles.small.title,
});
