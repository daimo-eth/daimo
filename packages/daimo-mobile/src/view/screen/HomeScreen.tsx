import { StyleSheet, Text, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.outerView}>
      <Text style={styles.title}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
});
