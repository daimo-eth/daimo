import {
  amountToDollars,
  assert,
  timeString,
  TransferOpEvent,
} from "@daimo/common";
import { chainConfig } from "@daimo/contract";
import { DaimoNonceMetadata } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useEffect } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { useAccount } from "../../model/account";
import { syncFindSameOp } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { AddrText } from "../shared/addr";
import { ParamListHome } from "../shared/nav";
import { OpStatusIndicator, OpStatusName } from "../shared/opStatus";
import { ss } from "../shared/style";
import { TextBody, TextH3, TextLight } from "../shared/text";

type Props = NativeStackScreenProps<ParamListHome, "HistoryOp">;

export function HistoryOpScreen({ route, navigation }: Props) {
  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  const [account] = useAccount();
  let { op } = route.params;
  op = syncFindSameOp(op, account?.recentTransfers || []) || op;

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
    <View style={ss.container.screen}>
      <Spacer h={32} />
      {body}
      <Spacer h={32} />
      {op.txHash && <LinkToExplorer txHash={op.txHash} />}
    </View>
  );
}

function LinkToExplorer({ txHash }: { txHash: string }) {
  const explorer = chainConfig.chainL2.blockExplorers!.default;
  const url = `${explorer.url}/tx/${txHash}`;

  const openURL = useCallback(() => Linking.openURL(url), []);

  return (
    <ButtonMed
      onPress={openURL}
      type="subtle"
      title={`View on ${explorer.name}`}
    />
  );
}

function TransferBody({ op }: { op: TransferOpEvent }) {
  const [account] = useAccount();
  assert(account != null);

  const opRequestId = op.nonceMetadata
    ? DaimoNonceMetadata.fromHex(op.nonceMetadata)?.identifier.toString()
    : undefined;
  const matchingTrackedRequest = account.trackedRequests.find(
    (req) =>
      req.requestId === opRequestId &&
      req.amount === `${op.amount}` &&
      op.to === account.address
  );

  const kv: [string, ReactNode][] = [];

  if (op.from === account.address) {
    kv.push(["Recipient", <AddrText addr={op.to} />]);
  } else {
    kv.push(["Sender", <AddrText addr={op.from} />]);
  }

  if (matchingTrackedRequest != null) {
    const amount = amountToDollars(BigInt(matchingTrackedRequest.amount));
    kv.push(["Amount you requested", amount]);
  }

  kv.push(["Date", timeString(op.timestamp)]);

  if (op.feeAmount !== undefined) {
    kv.push(["Fee", `$${amountToDollars(op.feeAmount)}`]);
  }

  const coinName = chainConfig.tokenSymbol;
  const chainName = chainConfig.chainL2.name;
  kv.push(["Currency", `${coinName} on ${chainName}`]);

  return (
    <View>
      <TitleAmount amount={BigInt(op.amount)} />
      <Spacer h={32} />
      <View style={styles.kvWrap}>
        <View style={styles.kvList}>
          {kv.map(([k, v]) => (
            <View key={k} style={styles.kvRow}>
              <View style={styles.kvKey}>
                <TextLight>{k}</TextLight>
              </View>
              <TextBody>{v}</TextBody>
            </View>
          ))}
        </View>
      </View>
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
  kvWrap: {
    flexDirection: "row",
    justifyContent: "center",
  },
  kvList: {
    flexDirection: "column",
    gap: 4,
  },
  kvRow: {
    flexDirection: "row",
  },
  kvKey: {
    width: 128,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});
