import { useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { useNav } from "../shared/nav";
import { color, ss } from "../shared/style";
import { timeAgo, useTime } from "../shared/time";

export function UserScreen() {
  const [account, setAccount] = useAccount();
  const nowS = useTime();
  const nav = useNav();
  useEffect(() => {
    if (account == null) nav.navigate("Home");
  }, [account, nav]);

  if (!account) return null;

  return (
    <>
      <View style={styles.container}>
        <Text style={ss.text.h2}>Account</Text>
        <Text style={ss.text.body} numberOfLines={1}>
          {account.address}
        </Text>
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
    backgroundColor: color.white,
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "column",
    gap: 8,
    padding: 16,
    alignItems: "flex-start",
  },
});
