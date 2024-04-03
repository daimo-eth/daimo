import {
  DaimoLinkNoteV2,
  DaimoNoteState,
  DaimoNoteStatus,
  DisplayOpEvent,
  EAccount,
  OpStatus,
  PaymentLinkOpEvent,
  amountToDollars,
  getAccountName,
} from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { createContext, useCallback, useContext } from "react";
import { Linking, View } from "react-native";
import { Address } from "viem";

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
import { AccountRow } from "../shared/AccountRow";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig, LinkButton } from "../shared/Button";
import { CenterSpinner } from "../shared/CenterSpinner";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import {
  TextBody,
  TextBodyCaps,
  TextCenter,
  TextError,
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
      <ScreenHeader
        title={getOpVerb(op, account.address)}
        onExit={leaveScreen}
        hideOfflineHeader
      />
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
  const nav = useNav();

  let other: EAccount;
  const sentByUs = op.from === account.address;
  if (sentByUs) {
    other = getCachedEAccount(op.to);
  } else {
    other = getCachedEAccount(op.from);
  }

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

  for (let i = subtitleElems.length - 1; i > 0; i--) {
    const spacerText = " • ";
    const space = <React.Fragment key={i}>{spacerText}</React.Fragment>;
    subtitleElems.splice(i, 0, space);
  }

  return (
    <View>
      <TitleAmount
        amount={BigInt(op.amount)}
        preSymbol={sentByUs ? "-" : "+"}
        style={sentByUs ? { color: "black" } : { color: color.success }}
      />
      {op.type === "transfer" && op.memo && (
        <>
          <Spacer h={4} />
          <TextCenter>
            <TextBodyCaps color={color.grayMid}>{op.memo}</TextBodyCaps>
          </TextCenter>
        </>
      )}
      <Spacer h={16} />
      <TouchableOpacity onPress={onShowHelp} hitSlop={8}>
        <TextCenter>
          <TextBodyCaps color={color.grayMid}>{subtitleElems}</TextBodyCaps>
        </TextCenter>
      </TouchableOpacity>
      <Spacer h={32} />
      <AccountRow
        acc={other}
        timestamp={op.timestamp}
        viewAccount={() => navToAccountPage(other, nav)}
        pending={op.status === "pending"}
      />
    </View>
  );
}

function getOpVerb(op: DisplayOpEvent, accountAddress: Address) {
  const isPayLink = op.type === "createLink" || op.type === "claimLink";
  const sentByUs = op.from === accountAddress;
  const isRequestResponse = op.type === "transfer" && op.requestStatus != null;

  if (isPayLink) {
    return sentByUs ? "Created link" : "Accepted link";
  } else if (isRequestResponse) {
    return sentByUs ? "Fulfilled request" : "Received request";
  } else {
    return sentByUs ? "Sent" : "Received";
  }
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
