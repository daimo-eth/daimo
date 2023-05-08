import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChainContext, ChainTip } from "../../logic/chain";
import { ss } from "../shared/style";
import { timeAgo, useTime } from "../shared/time";

export function ChainScreen() {
  const { status } = useContext(ChainContext);

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: "bold" }}>Status {status.status}</Text>
      {status.status === "ok" && (
        <>
          <Text style={ss.text.h2}>L1</Text>
          <TipInfo tip={status.l1} />
          <Text style={ss.text.h2}>L2</Text>
          <TipInfo tip={status.l2} />
        </>
      )}
    </View>
  );
}

function TipInfo({ tip }: { tip: ChainTip }) {
  const nowS = useTime();
  return (
    <>
      <Text>Block #{tip.blockHeight}</Text>
      <Text>Time ${timeAgo(tip.blockTimestamp, nowS)}</Text>
    </>
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
