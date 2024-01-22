import {
  DaimoLinkNoteV2,
  DaimoNoteState,
  DaimoNoteStatus,
  DisplayOpEvent,
  EAccount,
  OpEvent,
  OpStatus,
  PaymentLinkOpEvent,
  amountToDollars,
  getAccountName,
  timeString,
} from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { createContext, useCallback, useContext } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";

import { NoteDisplay } from "./link/NoteScreen";
import { getCachedEAccount } from "../../logic/addr";
import { env } from "../../logic/env";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../model/account";
import { syncFindSameOp } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { ContactBubble } from "../shared/ContactBubble";
import { PendingDot } from "../shared/PendingDot";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import {
  ParamListBottomSheet,
  useDisableTabSwipe,
  useNav,
} from "../shared/nav";
import { color, ss } from "../shared/style";
import {
  TextBody,
  TextBodyCaps,
  TextCenter,
  TextError,
  TextH3,
  TextPara,
} from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

type Props = NativeStackScreenProps<
  ParamListBottomSheet,
  "BottomSheetHistoryOp"
>;

export const ToggleBottomSheetContext = createContext((expand: boolean) => {});

export function HistoryOpScreen(props: Props) {
  const Inner = useWithAccount(HistoryOpScreenInner);
  return <Inner {...props} />;
}

function HistoryOpScreenInner({
  account,
  route,
}: Props & { account: Account }) {
  const toggleBottomSheet = useContext(ToggleBottomSheetContext);
  const nav = useNav();
  useDisableTabSwipe(nav);

  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  // A pending op always has an opHash (since its initiated by the user's
  // account).
  let { op } = route.params;
  op =
    syncFindSameOp(
      { opHash: op.opHash, txHash: op.txHash },
      account.recentTransfers
    ) || op;

  const { chainConfig } = env(daimoChainFromId(account.homeChainId));

  return (
    <View style={ss.container.screen}>
      <ScreenHeader
        title="Transfer"
        onExit={() => {
          toggleBottomSheet(false); // Collapse to small height
          if (nav.canGoBack()) {
            nav.goBack();
          }
        }}
        hideOfflineHeader
      />
      <Spacer h={16} />
      <TransferBody account={account} op={op} />
      <Spacer h={36} />
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
  // Strip seed from link
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
  // TODO: show if this transfer filled our request.
  // const opRequestId = op.nonceMetadata
  //   ? DaimoNonceMetadata.fromHex(op.nonceMetadata)?.identifier.toString()
  //   : undefined;
  // const matchingTrackedRequest = account.trackedRequests.find(
  //   (req) =>
  //     req.requestId === opRequestId &&
  //     req.amount === `${op.amount}` &&
  //     op.to === account.address
  // );

  let other: EAccount;
  const sentByUs = op.from === account.address;
  if (sentByUs) {
    other = getCachedEAccount(op.to);
  } else {
    other = getCachedEAccount(op.from);
  }
  const isPayLink = other.label === "payment link";
  const verb = isPayLink
    ? sentByUs
      ? "Created link"
      : "Accepted link"
    : sentByUs
    ? "Sent"
    : "Received";

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol.toUpperCase();
  const chainName = chainConfig.chainL2.name.toUpperCase();

  return (
    <View style={ss.container.padH16}>
      <TextCenter>
        <TextH3 color={color.grayDark}>{verb}</TextH3>
      </TextCenter>
      <Spacer h={4} />
      <TitleAmount
        amount={BigInt(op.amount)}
        preSymbol={sentByUs ? "-" : "+"}
        style={sentByUs ? { color: "black" } : { color: color.success }}
      />
      <Spacer h={8} />
      <TextCenter>
        <TextBodyCaps color={color.grayMid}>
          <FeeText amount={op.feeAmount} /> • {coinName} • {chainName}
        </TextBodyCaps>
      </TextCenter>
      <Spacer h={32} />
      <OpRow op={op} otherAcc={other} />
      <View style={styles.transferBorder} />
    </View>
  );
}

function OpRow({ op, otherAcc }: { op: OpEvent; otherAcc: EAccount }) {
  const isPending = op.status === "pending";
  const textDark = isPending ? color.gray3 : color.midnight;
  const textLight = isPending ? color.gray3 : color.grayMid;

  const date = timeString(op.timestamp);

  return (
    <View style={styles.transferBorder}>
      <View style={styles.transferRowWrap}>
        <View style={styles.transferRow}>
          <View style={styles.transferOtherAccount}>
            <ContactBubble
              contact={{ type: "eAcc", ...otherAcc }}
              size={36}
              {...{ isPending }}
            />
            <TextBody color={textDark}>{getAccountName(otherAcc)}</TextBody>
            {isPending && <PendingDot />}
          </View>
          <TextPara color={textLight}>{date}</TextPara>
        </View>
      </View>
    </View>
  );
}

function FeeText({ amount }: { amount?: number }) {
  if (amount == null) {
    return "PENDING";
  }

  let feeStr = "$" + amountToDollars(amount);
  if (amount > 0 && feeStr === "$0.00") {
    feeStr = "< $0.01";
  }
  return feeStr === "$0.00" ? "NO FEE" : feeStr + " FEE";
}

const styles = StyleSheet.create({
  transferBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
  },
  transferRowWrap: {
    marginHorizontal: -24,
  },
  transferRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transferOtherAccount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
