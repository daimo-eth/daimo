import { Button, StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";

export default function HomeScreen() {
  const [account] = useAccount();

  return (
    <View style={styles.outerView}>
      <Header />
      <View style={styles.amountAndButtons}>
        <TitleAmount
          symbol="Ξ"
          balance={account.lastBalance}
          decimals={18}
          displayDecimals={3}
        />
        <Spacer h={32} />
        <View style={styles.buttonRow}>
          <Button title="Send" onPress={() => {}} />
          <Button title="Receive" onPress={() => {}} />
        </View>
      </View>
      <Footer />
    </View>
  );
}

function TitleAmount({
  symbol,
  balance,
  decimals,
  displayDecimals,
}: {
  symbol: string;
  balance: bigint;
  decimals: number;
  displayDecimals: number;
}) {
  if (!(balance >= 0)) throw new Error("Invalid amount");

  balance = balance / BigInt(10 ** (decimals - displayDecimals));
  const dispStr = balance.toString().padStart(displayDecimals + 1, "0");
  const dollars = dispStr.slice(0, -displayDecimals);
  const cents = dispStr.slice(-displayDecimals);

  return (
    <Text style={styles.title}>
      <Text style={styles.titleSmall}>{symbol}</Text>
      <Spacer w={4} />
      {dollars}
      <Text style={styles.titleGray}>.{cents}</Text>
    </Text>
  );
}

function Footer() {
  return (
    <View>
      <Text>coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  amountAndButtons: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  titleSmall: {
    fontSize: 24,
  },
  titleGray: {
    color: color.gray,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 32,
  },
});
