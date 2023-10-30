import {
  amountToDollars,
  DaimoNoteStatus,
  OpStatus,
  timeString,
  TrackedNote,
  TransferOpEvent,
} from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import { DaimoNonceMetadata } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";

import { NoteDisplay } from "./link/NoteScreen";
import { env } from "../../logic/env";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../model/account";
import { syncFindSameOp } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { Badge } from "../shared/Badge";
import { ButtonBig } from "../shared/Button";
import { ScreenHeader, useExitBack } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { AddrText } from "../shared/addr";
import { ParamListHome } from "../shared/nav";
import { OpStatusIndicator, OpStatusName } from "../shared/opStatus";
import { ss } from "../shared/style";
import {
  TextBody,
  TextCenter,
  TextError,
  TextH3,
  TextLight,
} from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

type Props = NativeStackScreenProps<ParamListHome, "HistoryOp">;

export function HistoryOpScreen(props: Props) {
  const Inner = useWithAccount(HistoryOpScreenInner);
  return <Inner {...props} />;
}

function HistoryOpScreenInner({
  account,
  route,
}: Props & { account: Account }) {
  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  let { op } = route.params;
  op = syncFindSameOp(op, account.recentTransfers) || op;

  // If we sent a note, show the note screen.
  // TODO: annotate note info directly on op via sync
  // This approach works, but means we can never expire "pendingNotes"
  // even when they are no longer pending.
  const pendingNote =
    op.opHash && account.pendingNotes.find((n) => n.opHash === op.opHash);

  const { chainConfig } = env(daimoChainFromId(account.homeChainId));

  const shouldShowNote =
    pendingNote && [OpStatus.confirmed, OpStatus.finalized].includes(op.status);

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
      <Spacer h={16} />
      {shouldShowNote && <NoteView account={account} note={pendingNote} />}
    </View>
  );
}

function NoteView({ account, note }: { account: Account; note: TrackedNote }) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  const noteFetch = useFetchLinkStatus(note, daimoChain)!;
  const noteStatus = noteFetch.data as DaimoNoteStatus | undefined;

  return (
    <View>
      {noteFetch.isFetching && <Spinner />}
      {noteFetch.error && <TextError>{noteFetch.error.message}</TextError>}
      {noteStatus && <NoteDisplay {...{ account, noteStatus }} hideAmount />}
    </View>
  );
}

function Spinner() {
  return (
    <View style={ss.container.center}>
      <ActivityIndicator size="large" />
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
    <ButtonBig
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
    kv.push([
      "Recipient",
      <TextBody>
        <AddrText addr={op.to} />
      </TextBody>,
    ]);
  } else {
    kv.push([
      "Sender",
      <TextBody>
        <AddrText addr={op.from} />
      </TextBody>,
    ]);
  }

  if (matchingTrackedRequest != null) {
    const amount = amountToDollars(BigInt(matchingTrackedRequest.amount));
    kv.push(["Amount you requested", <TextBody>{amount}</TextBody>]);
  }

  kv.push(["Date", <TextBody>{timeString(op.timestamp)}</TextBody>]);

  if (op.feeAmount !== undefined) {
    const feeStr = "$" + amountToDollars(BigInt(op.feeAmount));
    const feeElem =
      feeStr === "$0.00" ? (
        <>
          <TextBody>{feeStr}</TextBody>
          <Spacer w={8} />
          <Badge>FREE</Badge>
        </>
      ) : (
        <TextBody>{feeStr}</TextBody>
      );
    kv.push(["Fee", feeElem]);
  }

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol;
  const chainName = chainConfig.chainL2.name;
  kv.push(["Currency", <TextBody>{coinName}</TextBody>]);
  kv.push(["Chain", <TextBody>{chainName}</TextBody>]);

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
              {v}
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
    alignItems: "baseline",
  },
  kvKey: {
    width: 128,
  },
  kvVal: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});
