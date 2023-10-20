import Octicons from "@expo/vector-icons/Octicons";
import { useCallback } from "react";
import { Dimensions, StyleSheet, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HistoryList, HistoryScreen } from "./HistoryScreen";
import { useWarmCache } from "../../action/useSendAsync";
import { Account, useAccount } from "../../model/account";
import { SwipeUpDown } from "../../vendor/SwipeUpDown";
import { TitleAmount } from "../shared/Amount";
import { Button, buttonStyles } from "../shared/Button";
import { Header } from "../shared/Header";
import { OctName } from "../shared/InputBig";
import ScrollPellet from "../shared/ScrollPellet";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextCenter, TextLight } from "../shared/text";

export default function HomeScreen() {
  const [account] = useAccount();
  console.log(
    `[HOME] rendering with account ${account?.name}, ${account?.recentTransfers?.length} ops`
  );

  const keySlot = account?.accountKeys.find(
    (keyData) => keyData.pubKey === account?.enclavePubKey
  )?.slot;
  useWarmCache(account?.enclaveKeyName, account?.address, keySlot);

  const nav = useNav();
  const setIsHistoryOpened = useCallback((isOpened: boolean) => {
    nav.setOptions({ title: isOpened ? "History" : "Home" });
  }, []);

  if (account == null) return null;

  return (
    <SafeAreaView style={ss.container.fullWidthScroll}>
      <Header />

      <View style={styles.amountAndButtonsContainer}>
        <AmountAndButtons account={account} />
      </View>
      <SwipeUpDown
        itemMini={
          <View style={styles.historyElem}>
            <ScrollPellet />
            <HistoryList account={account} maxToShow={5} />
          </View>
        }
        itemFull={<HistoryScreen />}
        onShowMini={() => setIsHistoryOpened(false)}
        onShowFull={() => setIsHistoryOpened(true)}
        animation="spring"
        extraMarginTop={0}
        swipeHeight={192}
      />
    </SafeAreaView>
  );
}

function AmountAndButtons({ account }: { account: Account }) {
  const nav = useNav();
  const goSend = useCallback(
    () => nav.navigate("SendTab", { screen: "Send", params: {} }),
    [nav]
  );
  const goRequest = useCallback(
    () => nav.navigate("ReceiveTab", { screen: "Request" }),
    [nav]
  );
  const goDeposit = useCallback(() => nav.navigate("DepositTab"), [nav]);

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
  const handlePress = disabled ? undefined : onPress;
  return (
    <TouchableHighlight
      onPress={handlePress}
      {...touchHighlightUnderlay.subtle}
      style={styles.iconButtonHighlight}
    >
      <View>
        <Button
          disabled={disabled}
          onPress={handlePress}
          style={iconButtonStyle}
          touchUnderlay={touchHighlightUnderlay.primary}
        >
          <TextCenter>{icon}</TextCenter>
        </Button>
        <Spacer h={8} />
        <View style={styles.iconButtonLabel}>
          {disabled && <TextLight>{title}</TextLight>}
          {!disabled && <TextBody>{title}</TextBody>}
        </View>
      </View>
    </TouchableHighlight>
  );
}

const screenDimensions = Dimensions.get("screen");

const iconButtonStyle = StyleSheet.create({
  button: {
    ...buttonStyles.big.button,
    backgroundColor: color.primary,
    height: 72,
    paddingTop: 24,
    borderRadius: 72,
  },
  title: {
    ...buttonStyles.big.title,
    color: color.white,
  },
});

const styles = StyleSheet.create({
  amountAndButtons: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: screenDimensions.height - 256,
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  iconButtonHighlight: {
    borderRadius: 16,
    padding: 16,
    width: 104,
  },
  iconButtonLabel: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "center",
  },
  historyScroll: {
    paddingTop: 32,
  },
  historyElem: {
    backgroundColor: color.white,
    minHeight: screenDimensions.height,
  },
  amountAndButtonsContainer: {
    flex: 1,
    alignItems: "stretch",
  },
});
