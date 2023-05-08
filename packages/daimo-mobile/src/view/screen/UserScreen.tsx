import { Button, StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { timeAgo, useTime } from "../shared/time";

export function UserScreen() {
  const [account, setAccount] = useAccount();

  const nowS = useTime();

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: "bold" }}>{account.address}</Text>
      <Text>Bal {"" + account.lastBalance}</Text>
      <Text>As of {timeAgo(account.lastBlockTimestamp, nowS)}</Text>
      <Button title="Clear wallet" onPress={() => setAccount(undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    padding: 16,
    alignItems: "flex-start",
  },
});
