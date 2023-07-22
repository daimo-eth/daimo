import { assert, TransferOpEvent } from "@daimo/common";
import { Octicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect } from "react";
import { Linking, StyleSheet, View, Text } from "react-native";

import { chainConfig } from "../../logic/chainConfig";
import { useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { ButtonSmall } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { AddrText } from "../shared/addr";
import { HomeStackParamList } from "../shared/nav";
import { OpStatusIndicator, OpStatusName } from "../shared/opStatus";
import { ss } from "../shared/style";
import { TextCenter, TextH3, TextLight } from "../shared/text";
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
      <Spacer h={8} />
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
      <TextLight numberOfLines={1}>
        <TextCenter>
          <Octicons name="link-external" size={16} />
          {` \u00A0 `}
          View on {explorer.name}
        </TextCenter>
      </TextLight>
    </ButtonSmall>
  );
}

function TransferBody({ op }: { op: TransferOpEvent }) {
  const [account] = useAccount();
  assert(account != null);

  const [directionSymbol, directionText] = (() => {
    if (op.from === account.address) {
      return [
        "↗",
        <>
          to <AddrText addr={op.to} />
        </>,
      ];
    } else {
      return [
        "↘",
        <>
          from <AddrText addr={op.from} />
        </>,
      ];
    }
  })();

  return (
    <View>
      <TitleAmount amount={BigInt(op.amount)} />
      <Spacer h={16} />
      <Text style={styles.h2Small}>
        <Text>{directionSymbol}</Text>
        <Spacer w={8} />
        <Text>{directionText}</Text>
      </Text>
      <Spacer h={16} />
      <Text style={styles.h3Small}>
        <Text>{timeString(op.timestamp)}</Text>
      </Text>
      <Spacer h={16} />
      <View style={styles.statusRow}>
        <OpStatusIndicator status={op.status} size={24} />
        <TextH3>
          <OpStatusName status={op.status} />
        </TextH3>
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
  h2Small: {
    fontSize: 20,
    textAlign: "center",
  },
  h3Small: {
    fontSize: 18,
    textAlign: "center",
  },
});
