import Octicons from "@expo/vector-icons/Octicons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useCallback, useState } from "react";
import { Dimensions, StyleSheet, TouchableHighlight, View } from "react-native";
import SwipeUpDown from "react-native-swipe-up-down";

import { HistoryList, HistoryScreen } from "./HistoryScreen";
import { useWarmCache } from "../../action/useSendAsync";
import { Account, useAccount } from "../../model/account";
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

  const headerHeight = useHeaderHeight();

  const [isHistoryOpened, setIsHistoryOpened] = useState(false);

  const addTopOffset = isHistoryOpened ? 0 : headerHeight;

  if (account == null) return null;

  return (
    <View
      style={{
        ...ss.container.homeContainer,
        top: -addTopOffset,
        paddingTop: addTopOffset,
      }}
    >
      <View style={styles.headerContainer}>
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
        disableSwipeIcon
        extraMarginTop={0}
        swipeHeight={300}
        style={styles.swipeUpDownRoot}
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
  headerContainer: {
    paddingLeft: 50,
    paddingRight: 50,
  },
  amountAndButtonsContainer: {
    flex: 1,
    alignItems: "stretch",
  },
  swipeUpDownRoot: {
    backgroundColor: "#fff",
  },
});
