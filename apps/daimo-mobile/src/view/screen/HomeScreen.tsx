import { tokenMetadata } from "@daimo/contract";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { Button, buttonStyles } from "../shared/Button";
import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { ss } from "../shared/style";

export default function HomeScreen() {
  const [account] = useAccount();
  console.log(`[HOME] rendering with account ${account?.name}`);

  const nav = useNav();
  const goSend = useCallback(() => nav.navigate("Send"), [nav]);
  const goReceive = useCallback(() => nav.navigate("Receive"), [nav]);

  if (account == null) return null;

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <View style={styles.amountAndButtons}>
        <TitleAmount
          symbol="$"
          amount={account.lastBalance}
          decimals={tokenMetadata.decimals}
          displayDecimals={2}
        />
        <Spacer h={32} />
        <View style={styles.buttonRow}>
          <Button
            style={sendRecvButton}
            title="Send"
            onPress={goSend}
            disabled={account.lastBalance === 0n}
          />
          <Button style={sendRecvButton} title="Receive" onPress={goReceive} />
        </View>
      </View>
      <View style={ss.spacer.h32} />
    </View>
  );
}

const styles = StyleSheet.create({
  amountAndButtons: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 24,
  },
});

const sendRecvButton = StyleSheet.create({
  button: {
    ...buttonStyles.big.button,
    width: 128,
  },
  title: buttonStyles.big.title,
});
