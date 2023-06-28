import { useContext } from "react";
import { StyleSheet, View } from "react-native";

import { ChainContext, ChainTip } from "../../logic/chain";
import { color, ss } from "../shared/style";
import { TextBody, TextBold, TextH2, TextSmall } from "../shared/text";
import { timeAgoS, useTime } from "../shared/time";

export function ChainScreen() {
  const { status } = useContext(ChainContext);

  return (
    <View style={styles.container}>
      {status.status === "ok" && (
        <>
          <View style={ss.container.ph16}>
            <View style={ss.spacer.h16} />
            <TextH2>L1 · {status.l1.name}</TextH2>
            <TipInfo tip={status.l1} />
            <View style={ss.spacer.h32} />
            <TextH2>L2 · {status.l2.name}</TextH2>
            <TipInfo tip={status.l2} />
          </View>
          <View style={ss.spacer.h32} />
          <LightClientInfo />
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
        Block #{tip.blockHeight} · {timeAgoS(tip.blockTimestamp, nowS)}
      </TextBody>
    </>
  );
}

function LightClientInfo() {
  const cs = useContext(ChainContext);
  if (cs.chain == null) return null;

  return (
    <View style={styles.callout}>
      <TextSmall>
        <TextBold>Light client placeholder.</TextBold> We're considering adding
        a built-in light client, like Helios. We'll show light client status
        here.
      </TextSmall>
    </View>
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
  callout: {
    backgroundColor: color.bg.lightGray,
    padding: 16,
    borderRadius: 24,
    alignSelf: "stretch",
  },
});
