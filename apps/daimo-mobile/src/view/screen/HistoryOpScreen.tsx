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
import Octicons from "@expo/vector-icons/Octicons";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { createContext, useCallback, useContext } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { NoteDisplay } from "./link/NoteScreen";
import { Dispatcher, DispatcherContext } from "../../action/dispatch";
import {
  ParamListBottomSheet,
  navToAccountPage,
  useNav,
} from "../../common/nav";
import { getCachedEAccount } from "../../logic/addr";
import { env } from "../../logic/env";
import { useFetchLinkStatus } from "../../logic/linkStatus";
import { Account } from "../../model/account";
import { syncFindSameOp } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig, LinkButton } from "../shared/Button";
import { CenterSpinner } from "../shared/CenterSpinner";
import { ContactBubble } from "../shared/ContactBubble";
import { PendingDot } from "../shared/PendingDot";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
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

// Allows the HistoryOpScreen to change the bottom sheet snap point count.
// This allows the bottom sheet to be dismissed when the user exits the detail
// screen and only display the half screen snap point when the user is on the
// detail screen.
export const SetBottomSheetSnapPointCount = createContext((snaps: 2 | 3) => {});

export function HistoryOpScreen(props: Props) {
  const Inner = useWithAccount(HistoryOpScreenInner);
  return <Inner {...props} />;
}

function HistoryOpScreenInner({
  account,
  route,
}: Props & { account: Account }) {
  const setBottomSheetSnapPointCount = useContext(SetBottomSheetSnapPointCount);

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

  const leaveScreen = () => {
    if (nav.canGoBack()) {
      setBottomSheetSnapPointCount(3);
      nav.goBack();
    }
  };

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Transfer" onExit={leaveScreen} hideOfflineHeader />
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
          <NoteView account={account} note={op} leaveScreen={leaveScreen} />
        )}
    </View>
  );
}

function NoteView({
  account,
  note,
  leaveScreen,
}: {
  account: Account;
  note: PaymentLinkOpEvent;
  leaveScreen: () => void;
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
        <NoteDisplay
          {...{ account, noteStatus }}
          hideAmount
          leaveScreen={leaveScreen}
        />
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

  // Help button to explain fees, chain, etc
  const dispatcher = useContext(DispatcherContext);
  const onShowHelp = useCallback(() => showHelpWhyNoFees(dispatcher), []);

  // Generate subtitle = fees, chain, other details
  const col = color.grayMid;
  const subtitleElems = [
    <React.Fragment key="fees">
      <TextBodyCaps color={col}>{getFeeText(op.feeAmount)}</TextBodyCaps>
    </React.Fragment>,
    <React.Fragment key="coin">
      <TextBody color={col}>{coinName}</TextBody>
    </React.Fragment>,
    <React.Fragment key="chain">
      {chainName}
      <Spacer w={8} />
      <Octicons size={16} name="info" color={col} />
    </React.Fragment>,
  ];
  if (op.type === "transfer" && op.memo) {
    subtitleElems.unshift(
      <React.Fragment key="memo">{op.memo}</React.Fragment>
    );
  }
  for (let i = subtitleElems.length - 1; i > 0; i--) {
    const spacerText = " • ";
    const space = <React.Fragment key={i}>{spacerText}</React.Fragment>;
    subtitleElems.splice(i, 0, space);
  }

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
      <TouchableOpacity onPress={onShowHelp} hitSlop={8}>
        <TextCenter>
          <TextBodyCaps color={color.grayMid}>{subtitleElems}</TextBodyCaps>
        </TextCenter>
      </TouchableOpacity>
      <Spacer h={32} />
      <OpRow op={op} otherAcc={other} />
      <View style={styles.transferBorder} />
    </View>
  );
}

function showHelpWhyNoFees(dispatcher: Dispatcher) {
  dispatcher.dispatch({
    name: "helpModal",
    title: "How transfers work",
    content: (
      <View style={ss.container.padH8}>
        <TextPara>Daimo uses Base, an Ethereum rollup.</TextPara>
        <Spacer h={24} />
        <TextPara>
          Rollups inherit the strong security guarantees of Ethereum, at much
          lower cost.
        </TextPara>
        <Spacer h={24} />
        <LinkButton url="https://l2beat.com/scaling/projects/base">
          Learn more on L2Beat.
        </LinkButton>
      </View>
    ),
  });
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

function getFeeText(amount?: number) {
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
  subtitle: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subtitleElem: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    ...ss.container.debug,
  },
});
