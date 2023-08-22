import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useRef } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { HistoryList } from "./History";
import { useWarmCache } from "../../action/useSendAsync";
import { Account, useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { Header } from "../shared/Header";
import { OctName } from "../shared/InputBig";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextCenter, TextLight } from "../shared/text";

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
        showsVerticalScrollIndicator={false}
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

  const isEmpty = account.lastBalance === 0n;

  return (
    <View style={styles.amountAndButtons}>
      <TitleAmount amount={account.lastBalance} />
      <Spacer h={32} />
      <View style={styles.buttonRow}>
        <IconButton title="Deposit" onPress={goDeposit} />
        <IconButton title="Request" onPress={goRequest} />
        <IconButton title="Send" onPress={goSend} disabled={isEmpty} />
      </View>
    </View>
  );
}

function IconButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const name: OctName = (function () {
    switch (title) {
      case "Send":
        return "paper-airplane";
      case "Request":
        return "apps";
      case "Deposit":
        return "download";
      default:
        return "question";
    }
  })();

  const icon = <Octicons name={name} size={24} color={color.white} />;
  const titleText = <TextCenter>{title}</TextCenter>;
  const handlePress = disabled ? undefined : onPress;
  return (
    <TouchableHighlight
      onPress={handlePress}
      {...touchHighlightUnderlay.blue}
      style={styles.iconButton}
    >
      <View>
        <ButtonBig type="primary" disabled={disabled} onPress={handlePress}>
          <TextCenter>{icon}</TextCenter>
        </ButtonBig>
        <Spacer h={8} />
        {disabled && <TextLight>{titleText}</TextLight>}
        {!disabled && <TextBody>{titleText}</TextBody>}
      </View>
    </TouchableHighlight>
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
  },
  iconButton: {
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
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
