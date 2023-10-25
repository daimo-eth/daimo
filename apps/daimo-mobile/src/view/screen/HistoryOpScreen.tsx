import { amountToDollars, timeString, TransferOpEvent } from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import { DaimoNonceMetadata } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { env } from "../../logic/env";
import { Account } from "../../model/account";
import { syncFindSameOp } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { Badge } from "../shared/Badge";
import { ButtonMed } from "../shared/Button";
import { ScreenHeader, useExitBack } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { AddrText } from "../shared/addr";
import { ParamListHome } from "../shared/nav";
import { OpStatusIndicator, OpStatusName } from "../shared/opStatus";
import { ss } from "../shared/style";
import { TextBody, TextCenter, TextH3, TextLight } from "../shared/text";
import { withAccount } from "../shared/withAccount";

type Props = NativeStackScreenProps<ParamListHome, "HistoryOp">;

export function HistoryOpScreen(props: Props) {
  const Inner = withAccount(HistoryOpScreenInner);
  return <Inner {...props} />;
}

function HistoryOpScreenInner({
  account,
  route,
  navigation,
}: Props & { account: Account }) {
  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  let { op } = route.params;
  op = syncFindSameOp(op, account.recentTransfers) || op;

  const { chainConfig } = env(daimoChainFromId(account.homeChainId));

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Transfer" modal onExit={useExitBack()} />
      <Spacer h={64} />
      <TransferBody account={account} op={op} />
      <Spacer h={64} />
      <View style={ss.container.padH16}>
        {op.txHash && (
          <LinkToExplorer {...{ chainConfig }} txHash={op.txHash} />
        )}
      </View>
    </View>
  );
}

function LinkToExplorer({
  chainConfig,
  txHash,
}: {
  chainConfig: ChainConfig;
  txHash: string;
}) {
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

function TransferBody({
  account,
  op,
}: {
  account: Account;
  op: TransferOpEvent;
}) {
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

  const sentByUs = op.from === account.address;
  if (sentByUs) {
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
    const feeStr = "$" + amountToDollars(BigInt(op.feeAmount));
    const feeVal =
      feeStr === "$0.00" ? (
        <>
          {feeStr}
          <Spacer w={8} />
          <Badge>FREE</Badge>
        </>
      ) : (
        feeStr
      );
    kv.push(["Fee", feeVal]);
  }

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol;
  const chainName = chainConfig.chainL2.name;
  kv.push(["Currency", coinName]);
  kv.push(["Chain", `${chainName}`]);

  return (
    <View>
      <TextCenter>
        <TextLight>{sentByUs ? "Sent" : "Received"}</TextLight>
      </TextCenter>
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
      <Spacer h={32} />
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
    gap: 8,
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
