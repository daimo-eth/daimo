import { Button, StyleSheet, Text, View } from "react-native";

import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";

export default function HomeScreen() {
  return (
    <View style={styles.outerView}>
      <Header />
      <View>
        <Text style={styles.title}>
          <Text style={styles.titleSmall}>$</Text>0.00
        </Text>
        <Spacer h={16} />
        <View style={styles.buttonRow}>
          <Button title="Send" onPress={() => {}} />
          <Button title="Receive" onPress={() => {}} />
        </View>
      </View>
      <Footer />
    </View>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  titleSmall: {
    fontSize: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
});
