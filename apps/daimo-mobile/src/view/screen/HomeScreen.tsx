import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { useWarmCache } from "../../action/useSendAsync";
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

  useWarmCache(account?.enclaveKeyName);

  const nav = useNav();
  const goSend = useCallback(() => nav.navigate("Send"), [nav]);
  const goReceive = useCallback(() => nav.navigate("Receive"), [nav]);
  const goDeposit = useCallback(() => nav.navigate("Deposit"), [nav]);
  const goWithdraw = useCallback(() => nav.navigate("Withdraw"), [nav]);

  if (account == null) return null;

  return (
    <View style={ss.container.outerStretch}>
      <Header />
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
          <Button style={bigButton} title="Receive" onPress={goReceive} />
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

const bigButton = StyleSheet.create({
  button: {
    ...buttonStyles.big.button,
    width: 128,
  },
  title: buttonStyles.big.title,
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
