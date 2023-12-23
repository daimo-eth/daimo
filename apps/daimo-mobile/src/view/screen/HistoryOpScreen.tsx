import {
  amountToDollars,
  DaimoLinkNoteV2,
  DaimoNoteStatus,
  DisplayOpEvent,
  OpStatus,
  timeString,
  PaymentLinkOpEvent,
  getAccountName,
  assert,
  DaimoNoteState,
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
import { SubtitleAmountChange } from "../shared/Amount";
import { Badge } from "../shared/Badge";
import { ButtonBig } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import {
  ParamListHome,
  useDisableTabSwipe,
  useExitBack,
  useNav,
} from "../shared/nav";
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
  const nav = useNav();
  useDisableTabSwipe(nav);

  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  // A pending op always has an opHash (since its initiated by the user's
  // account).
  let { op } = route.params;
  op = syncFindSameOp(op.opHash, account.recentTransfers) || op;

  const { chainConfig } = env(daimoChainFromId(account.homeChainId));

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Transfer" onBack={useExitBack()} />
      <Spacer h={32} />
      <TransferBody account={account} op={op} />
      <Spacer h={64} />
      <View style={ss.container.padH16}>
        {op.txHash && (
          <LinkToExplorer {...{ chainConfig }} txHash={op.txHash} />
        )}
      </View>
      <Spacer h={16} />
      {op.type === "createLink" &&
        [OpStatus.confirmed, OpStatus.finalized].includes(op.status) && (
          <NoteView account={account} note={op} />
        )}
    </View>
  );
}

function NoteView({
  account,
  note,
}: {
  account: Account;
  note: PaymentLinkOpEvent;
}) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  const link: DaimoLinkNoteV2 = {
    type: "notev2",
    id: note.noteStatus!.id!,
    sender: getAccountName(note.noteStatus!.sender),
    dollars: amountToDollars(note.amount),
    seed: "",
  };
  const noteFetch = useFetchLinkStatus(link, daimoChain)!;
  const noteStatus = noteFetch.data as DaimoNoteStatus | undefined;

  return (
    <View>
      {noteFetch.isFetching && <Spinner />}
      {noteFetch.error && <TextError>{noteFetch.error.message}</TextError>}
      {noteStatus && noteStatus.status === DaimoNoteState.Confirmed && (
        <NoteDisplay {...{ account, noteStatus }} hideAmount />
      )}
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

  const openURL = useCallback(() => Linking.openURL(url), [url]);

  return (
    <ButtonBig onPress={openURL} type="subtle" title="VIEW ON BLOCK EXPLORER" />
  );
}

function TransferBody({
  account,
  op,
}: {
  account: Account;
  op: DisplayOpEvent;
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

  const sentByUs = op.from === account.address;
  const amountChange = sentByUs ? -BigInt(op.amount) : BigInt(op.amount);

  const kv: [string, ReactNode][] = [];
  if (matchingTrackedRequest != null) {
    const amount = amountToDollars(BigInt(matchingTrackedRequest.amount));
    kv.push(["Amount you requested", <TextBody>{amount}</TextBody>]);
  }

  kv.push(["Date", <TextBody>{timeString(op.timestamp)}</TextBody>]);

  if (op.feeAmount !== undefined) {
    let feeStr = "$" + amountToDollars(BigInt(op.feeAmount));
    if (op.feeAmount > 0 && feeStr === "$0.00") {
      feeStr = "< $0.01";
    }
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

  // Summarize what happened
  let verb;
  if (op.type === "createLink") {
    assert(
      op.noteStatus.sender.addr === account.address,
      "link not created by self"
    );
    if (op.noteStatus.claimer) {
      if (op.noteStatus.claimer.addr === account.address) {
        verb = "Link reclaimed";
      } else {
        verb = "Link claimed by " + getAccountName(op.noteStatus.claimer);
      }
    } else {
      verb = "Link created";
    }
  } else if (op.type === "claimLink") {
    if (op.noteStatus.sender.addr === account.address) {
      verb = "Link reclaimed";
    } else {
      verb = "Link sent by " + getAccountName(op.noteStatus.sender);
    }
  } else {
    verb = sentByUs ? "Sent transfer" : "Received transfer";
  }

  return (
    <View>
      <Spacer h={32} />
      <TextCenter>
        <TextLight>{verb}</TextLight>
      </TextCenter>
      <Spacer h={4} />
      <SubtitleAmountChange amount={amountChange} />
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
