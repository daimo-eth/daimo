import { Button, StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { color, ss } from "../shared/style";
import { timeAgo, useTime } from "../shared/time";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../HomeStack";

export function UserScreen() {
  const [account, setAccount] = useAccount();
  const nowS = useTime();
  const nav = useNavigation<StackNavigationProp<HomeStackParamList>>();
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
