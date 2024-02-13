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
  canSendTo,
  getAccountName,
  timeString,
} from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { createContext, useCallback, useContext } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { NoteDisplay } from "./link/NoteScreen";
import { getCachedEAccount } from "../../logic/addr";
import { env } from "../../logic/env";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../model/account";
import { syncFindSameOp } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { CenterSpinner } from "../shared/CenterSpinner";
import { ContactBubble } from "../shared/ContactBubble";
import { PendingDot } from "../shared/PendingDot";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { ParamListBottomSheet, navToAccountPage, useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
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

export const ChangeBottomSheetSnapsContext = createContext(
  (snaps: 2 | 3) => {}
);

export function HistoryOpScreen(props: Props) {
  const Inner = useWithAccount(HistoryOpScreenInner);
  return <Inner {...props} />;
}

function HistoryOpScreenInner({
  account,
  route,
}: Props & { account: Account }) {
  const changeBottomSheetSnaps = useContext(ChangeBottomSheetSnapsContext);

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

  const nav = useNav();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader
        title="Transfer"
        onExit={() => {
          if (nav.canGoBack()) {
            changeBottomSheetSnaps(3);
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
      {noteFetch.isFetching && <CenterSpinner />}
      {noteFetch.error && <TextError>{noteFetch.error.message}</TextError>}
      {noteStatus && noteStatus.status === DaimoNoteState.Confirmed && (
        <NoteDisplay {...{ account, noteStatus }} hideAmount />
      )}
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
  let other: EAccount;
  const sentByUs = op.from === account.address;
  if (sentByUs) {
    other = getCachedEAccount(op.to);
  } else {
    other = getCachedEAccount(op.from);
  }
  const isPayLink = other.label === "payment link";
  const isRequestResponse = op.type === "transfer" && op.requestStatus != null;

  const verb = (() => {
    if (isPayLink) {
      return sentByUs ? "Created link" : "Accepted link";
    } else if (isRequestResponse) {
      return sentByUs ? "Fulfilled request" : "Received request";
    } else {
      return sentByUs ? "Sent" : "Received";
    }
  })();

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol.toUpperCase();
  const chainName = chainConfig.chainL2.name.toUpperCase();

  return (
    <View>
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

  const nav = useNav();

  const viewAccount = useCallback(() => {
    navToAccountPage(otherAcc, nav);
  }, [nav, otherAcc]);

  return (
    <View style={styles.transferBorder}>
      <TouchableHighlight
        onPress={viewAccount}
        disabled={!canSendTo(otherAcc)}
        {...touchHighlightUnderlay.subtle}
        style={styles.transferRowWrap}
      >
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
      </TouchableHighlight>
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
