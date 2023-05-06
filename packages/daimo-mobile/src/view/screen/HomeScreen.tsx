import { Button, StyleSheet, Text, View } from "react-native";

import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";

export default function HomeScreen() {
  return (
    <View style={styles.outerView}>
      <Header />
      <View style={styles.amountAndButtons}>
        <TitleAmount amount={1.234} />
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

function TitleAmount({ amount }: { amount: number }) {
  if (!(amount >= 0)) throw new Error("Invalid amount");

  const totalCents = Math.round(amount * 100);
  const dollars = Math.floor(totalCents / 100);
  const centsStr = "" + (totalCents + 100);
  const cents = centsStr.substring(centsStr.length - 2);

  return (
    <Text style={styles.title}>
      <Text style={styles.titleSmall}>$</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 64,
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
