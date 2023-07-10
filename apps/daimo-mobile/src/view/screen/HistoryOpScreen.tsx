import { Octicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { chainConfig } from "../../logic/chain";
import { amountToDollars } from "../../logic/coin";
import { TransferOpEvent } from "../../model/op";
import { AddrText } from "../shared/AddrText";
import { ButtonSmall } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { HomeStackParamList } from "../shared/nav";
import { OpStatusIndicator, OpStatusName } from "../shared/opStatus";
import { ss } from "../shared/style";
import {
  TextBody,
  TextBold,
  TextCenter,
  TextH3,
  TextSmall,
} from "../shared/text";
import { timeString } from "../shared/time";

type Props = NativeStackScreenProps<HomeStackParamList, "HistoryOp">;

export function HistoryOpScreen({ route, navigation }: Props) {
  const { op } = route.params;

  const [title, body] = (() => {
    switch (op.type) {
      case "transfer":
        return ["Transfer", <TransferBody op={op} />];
      default:
        throw new Error(`unknown op type ${op.type}`);
    }
  })();

  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <View style={ss.container.vertModal}>
      <Spacer h={8} />
      {body}
      <Spacer h={32} />
      <View style={styles.statusRow}>
        <TextH3>
          <OpStatusName status={op.status} />
        </TextH3>
        <OpStatusIndicator status={op.status} size={24} />
      </View>
      {op.txHash && <LinkToExplorer txHash={op.txHash} />}
    </View>
  );
}

function LinkToExplorer({ txHash }: { txHash: string }) {
  const explorer = chainConfig.l2.blockExplorers.default;
  const url = `${explorer.url}/tx/${txHash}`;

  const openURL = useCallback(() => Linking.openURL(url), []);

  return (
    <ButtonSmall onPress={openURL}>
      <TextSmall numberOfLines={1}>
        <TextCenter>
          <Octicons name="link-external" size={16} />
          {` \u00A0 `}
          View on {explorer.name}
        </TextCenter>
      </TextSmall>
    </ButtonSmall>
  );
}

function TransferBody({ op }: { op: TransferOpEvent }) {
  return (
    <View style={styles.kvList}>
      <KVRow k="From" v={<AddrText addr={op.from} />} />
      <KVRow k="To" v={<AddrText addr={op.to} />} />
      <KVRow k="Amount" v={"$" + amountToDollars(op.amount)} />
      <KVRow k="Date" v={timeString(op.timestamp)} />
      {op.opHash && <KVRow k="User op" v={op.opHash} />}
      {op.blockNumber && <KVRow k="Block" v={op.blockNumber} />}
    </View>
  );
}

function KVRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <View style={styles.kvRow}>
      <View style={styles.kvKey}>
        <TextSmall numberOfLines={1}>{k}</TextSmall>
      </View>
      <View style={styles.kvVal}>
        <TextBody numberOfLines={1}>
          <TextBold>{v}</TextBold>
        </TextBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  kvList: {
    flexDirection: "column",
    gap: 8,
  },
  kvRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  kvKey: {
    flex: 0,
    width: 64,
  },
  kvVal: {
    flex: 1,
  },
});
