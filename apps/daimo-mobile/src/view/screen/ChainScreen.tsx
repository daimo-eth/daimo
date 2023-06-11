import { useContext } from "react";
import { StyleSheet, View } from "react-native";

import { ChainContext, ChainTip } from "../../logic/chain";
import { color } from "../shared/style";
import { TextBody, TextH2 } from "../shared/text";
import { timeAgo, useTime } from "../shared/time";

export function ChainScreen() {
  const { status } = useContext(ChainContext);

  return (
    <View style={styles.container}>
      {status.status === "ok" && (
        <>
          <TextH2>L1 · {status.l1.name}</TextH2>
          <TipInfo tip={status.l1} />
          <TextH2>L2 · {status.l2.name}</TextH2>
          <TipInfo tip={status.l2} />
        </>
      )}
      {status.status === "error" && (
        <>
          <TextH2>{status.error.name}</TextH2>
          <TextBody>{status.error.message}</TextBody>
        </>
      )}
    </View>
  );
}

function TipInfo({ tip }: { tip: ChainTip }) {
  const nowS = useTime();
  return (
    <>
      <TextBody>
        Block #{tip.blockHeight} · {timeAgo(tip.blockTimestamp, nowS)}
      </TextBody>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.white,
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "column",
    gap: 4,
    padding: 16,
    alignItems: "flex-start",
  },
});
