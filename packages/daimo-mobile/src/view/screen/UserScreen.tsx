import { Button, StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { ss } from "../shared/style";
import { timeAgo, useTime } from "../shared/time";

export function UserScreen() {
  const [account, setAccount] = useAccount();

  const nowS = useTime();

  return (
    <>
      <View style={styles.container}>
        <Text style={ss.text.bodyBold}>{account.address}</Text>
        <Text style={ss.text.body}>Bal {"" + account.lastBalance}</Text>
        <Text style={ss.text.body}>
          As of {timeAgo(account.lastBlockTimestamp, nowS)}
        </Text>
        <Button title="Clear wallet" onPress={() => setAccount(undefined)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "column",
    gap: 4,
    padding: 4,
    paddingVertical: 8,
    alignItems: "flex-start",
  },
});
