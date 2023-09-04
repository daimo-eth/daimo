import Octicons from "@expo/vector-icons/Octicons";
import { useCallback } from "react";
import { Dimensions, StyleSheet, TouchableHighlight, View } from "react-native";

import { HistoryList, HistoryScreen } from "./HistoryScreen";
import { useWarmCache } from "../../action/useSendAsync";
import { Account, useAccount } from "../../model/account";
import { SwipeUpDown } from "../../vendor/SwipeUpDown";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
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
    <View style={ss.container.fullWidthScroll}>
      <View style={ss.container.marginHNeg16}>
        <Header />
      </View>

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
        swipeHeight={256}
      />
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
  const titleText = <TextCenter numberOfLines={1}>{title}</TextCenter>;
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
    paddingHorizontal: 20,
  },
  iconButton: {
    flexGrow: 1,
    borderRadius: 16,
    padding: 12,
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
