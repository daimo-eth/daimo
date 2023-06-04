import { StyleSheet, Text, View } from "react-native";

import { useAccount } from "../../logic/account";
import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback } from "react";
import { HomeStackParamList } from "../HomeStack";
import { Button, buttonStyles } from "../shared/Button";
import { TextH1 } from "../shared/text";
import { trpc } from "../../logic/trpc";

export default function HomeScreen() {
  const [account] = useAccount();

  const search = trpc.search.useQuery({ prefix: "" });

  const nav = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const goSend = useCallback(() => {
    search.refetch(); // TODO
  }, [search]);
  const goReceive = useCallback(() => nav.navigate("Receive"), [nav]);

  return (
    <View style={styles.outerView}>
      <Header />
      <Text>
        {search.isFetching && "Fetching..."}
        {search.isError && search.error.message}
        {search.isSuccess && search.data.map((x) => x.name).join(", ")}
      </Text>
      <View style={styles.amountAndButtons}>
        <TitleAmount
          symbol="$"
          balance={account.lastBalance}
          decimals={18}
          displayDecimals={2}
        />
        <Spacer h={32} />
        <View style={styles.buttonRow}>
          <Button style={sendRecvButton} title="Send" onPress={goSend} />
          <Button style={sendRecvButton} title="Receive" onPress={goReceive} />
        </View>
      </View>
      <View style={ss.spacer.h32} />
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
    <TextH1>
      <Text style={styles.titleSmall}>{symbol}</Text>
      <Spacer w={4} />
      {dollars}
      <Text style={styles.titleGray}>.{cents}</Text>
    </TextH1>
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
  titleSmall: {
    fontSize: 30,
  },
  titleGray: {
    color: color.gray,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 24,
  },
});

const sendRecvButton = StyleSheet.create({
  button: {
    ...buttonStyles.big.button,
    width: 128,
  },
  title: buttonStyles.big.title,
});
