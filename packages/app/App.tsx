import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function App() {
  const [keyPair, setKeyPair] = useState<null | string>(null);

  return (
    <View style={styles.container}>
      <Button
        title="Generate key"
        onPress={useCallback(() => setKeyPair(genKeyPair()), [])}
      />
      <Text>Key: {keyPair}</Text>
      <Text>Hello world</Text>
      <StatusBar style="auto" />
    </View>
  );
}

function genKeyPair() {
  return "TODO";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
