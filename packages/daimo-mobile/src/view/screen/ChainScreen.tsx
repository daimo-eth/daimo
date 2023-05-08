import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChainContext, ChainTip } from "../../logic/chain";
import { ss } from "../shared/style";
import { timeAgo, useTime } from "../shared/time";

export function ChainScreen() {
  const { status } = useContext(ChainContext);

  return (
    <View style={styles.container}>
      {status.status === "ok" && (
        <>
          <Text style={ss.text.h2}>L1 · {status.l1.name}</Text>
          <TipInfo tip={status.l1} />
          <Text style={ss.text.h2}>L2 · {status.l2.name}</Text>
          <TipInfo tip={status.l2} />
        </>
      )}
      {status.status === "error" && (
        <>
          <Text style={ss.text.h2}>{status.error.name}</Text>
          <Text style={ss.text.body}>{status.error.message}</Text>
        </>
      )}
    </View>
  );
}

function TipInfo({ tip }: { tip: ChainTip }) {
  const nowS = useTime();
  return (
    <>
      <Text style={ss.text.body}>
        Block #{tip.blockHeight} · {timeAgo(tip.blockTimestamp, nowS)}
      </Text>
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
