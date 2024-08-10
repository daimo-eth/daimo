import {
  DaimoLinkNoteV2,
  DaimoNoteState,
  DaimoNoteStatus,
  OpStatus,
  PaymentLinkClog,
  TransferClog,
  amountToDollars,
  getAccountName,
  getChainDisplayName,
  getDisplayFromTo,
  getSynthesizedMemo,
  getDAv2Chain,
  tryOrNull,
} from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { createContext, useCallback, useContext } from "react";
import { Linking, View } from "react-native";
import { Address } from "viem";

import { Dispatcher, DispatcherContext } from "../../../action/dispatch";
import {
  ParamListBottomSheet,
  navToAccountPage,
  useNav,
} from "../../../common/nav";
import { env } from "../../../env";
import { i18NLocale, i18n } from "../../../i18n";
import { getCachedEAccount } from "../../../logic/addr";
import { shareURL } from "../../../logic/externalAction";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { Account } from "../../../storage/account";
import { syncFindSameOp } from "../../../sync/sync";
import { AccountRow } from "../../shared/AccountRow";
import { TitleAmount } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { CenterSpinner } from "../../shared/CenterSpinner";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import {
  TextBodyCaps,
  TextCenter,
  TextError,
  TextPara,
} from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { NoteDisplay } from "../link/NoteScreen";

type Props = NativeStackScreenProps<
  ParamListBottomSheet,
  "BottomSheetHistoryOp"
>;

// Allows the HistoryOpScreen to change the bottom sheet snap point count.
// This allows the bottom sheet to be dismissed when the user exits the detail
// screen and only display the half screen snap point when the user is on the
// detail screen.
export const SetBottomSheetDetailHeight = createContext((height: number) => {});

const i18 = i18n.historyOp;

export function HistoryOpBottomSheet(props: Props) {
  const Inner = useWithAccount(HistoryOpInner);
  return <Inner {...props} />;
}

function HistoryOpInner({ account, route }: Props & { account: Account }) {
  const setBottomSheetDetailHeight = useContext(SetBottomSheetDetailHeight);

  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  // A pending op always has an opHash (since its initiated by the user's
  // account).
  const { opHash, txHash } = route.params.op;
  const foundOp = syncFindSameOp({ opHash, txHash }, account.recentTransfers);
  const op = foundOp || route.params.op;

  const { chainConfig } = env(daimoChainFromId(account.homeChainId));

  const nav = useNav();

  const leaveScreen = () => {
    if (nav.canGoBack()) {
      setBottomSheetDetailHeight(0);
      nav.goBack();
    }
  };

  const sentPaymentLink =
    op.type === "createLink" &&
    op.noteStatus.claimer == null &&
    account.sentPaymentLinks.find((p) => p.id === op.noteStatus.id);
  const shareLinkAgain = sentPaymentLink && (() => shareURL(sentPaymentLink));

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title={getOpVerb(op, account.address)}
        onExit={leaveScreen}
        hideOfflineHeader
      />
      <TransferBody account={account} op={op} />
      <Spacer h={36} />
      <View style={ss.container.padH16}>
        {op.txHash && !shareLinkAgain && (
          <LinkToExplorer {...{ chainConfig }} op={op} />
        )}
        {shareLinkAgain && (
          <ButtonBig
            type="subtle"
            title={i18.shareLinkAgain()}
            onPress={shareLinkAgain}
          />
        )}
      </View>
      <Spacer h={16} />
      {op.type === "createLink" &&
        [OpStatus.confirmed, OpStatus.finalized].includes(op.status) && (
          <NoteView account={account} note={op} leaveScreen={leaveScreen} />
        )}
      {op.type === "createLink" && <Spacer h={16} />}
    </View>
  );
}

function NoteView({
  account,
  note,
  leaveScreen,
}: {
  account: Account;
  note: PaymentLinkClog;
  leaveScreen: () => void;
}) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  // Strip seed from link
  const link: DaimoLinkNoteV2 = {
    type: "notev2",
    id: note.noteStatus!.id!,
    sender: getAccountName(note.noteStatus!.sender, i18NLocale),
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
  op,
}: {
  chainConfig: ChainConfig;
  op: TransferClog;
}) {
  // Ethreceipts
  const chainId = chainConfig.chainL2.id;
  const { blockNumber, logIndex } = op;
  const url = `https://ethreceipts.org/l/${chainId}/${blockNumber}/${logIndex}`;

  const openURL = useCallback(() => Linking.openURL(url), [url]);

  return (
    <ButtonBig onPress={openURL} type="subtle" title={i18.viewReceipt()} />
  );
}

function TransferBody({ account, op }: { account: Account; op: TransferClog }) {
  const nav = useNav();

  const sentByUs = op.from === account.address;
  const [displayFrom, displayTo] = getDisplayFromTo(op);
  const other = getCachedEAccount(sentByUs ? displayTo : displayFrom);

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol;
  const chainName = chainConfig.chainL2.name.toUpperCase();

  // Special case: if this transfer is from or to a different coin
  let coinSubtitle = coinName;
  let chainSubtitle = chainName;
  let foreignChainName: string | undefined = undefined;
  if (op.type === "transfer") {
    const otherCoin = op.preSwapTransfer?.coin || op.postSwapTransfer?.coin;
    if (otherCoin) {
      const otherChain = tryOrNull(() => getDAv2Chain(otherCoin.chainId));
      if (op.preSwapTransfer?.coin) {
        coinSubtitle = `${otherCoin.symbol} → ${coinName}`;
        if (otherChain && otherChain.chainId !== chainConfig.chainL2.id) {
          foreignChainName = getChainDisplayName(otherChain);
          chainSubtitle = `${foreignChainName.toUpperCase()} → ${chainName}`;
        }
      } else if (op.postSwapTransfer?.coin) {
        coinSubtitle = `${coinName} → ${otherCoin.symbol}`;
        if (otherChain && otherChain.chainId !== chainConfig.chainL2.id) {
          foreignChainName = getChainDisplayName(otherChain);
          chainSubtitle = `${chainName} → ${foreignChainName.toUpperCase()}}`;
        }
      }
    }
  }

  // Help button to explain fees, chain, etc
  const dispatcher = useContext(DispatcherContext);
  const onShowHelp = useCallback(
    () =>
      showHelpWhyNoFees(dispatcher, chainConfig.chainL2.name, foreignChainName),
    []
  );

  // Generate subtitle = fees, chain, other details
  const col = color.grayMid;
  const subtitleElems = [
    <React.Fragment key="coin">{coinSubtitle}</React.Fragment>,
    <React.Fragment key="chain">{chainSubtitle}</React.Fragment>,
    <React.Fragment key="fees">
      <TextBodyCaps color={col}>{getFeeText(op.feeAmount)}</TextBodyCaps>
      <Spacer w={8} />
      <Octicons size={16} name="info" color={col} />
    </React.Fragment>,
  ];

  for (let i = subtitleElems.length - 1; i > 0; i--) {
    const spacerText = " • ";
    const space = <React.Fragment key={i}>{spacerText}</React.Fragment>;
    subtitleElems.splice(i, 0, space);
  }

  const memoText = getSynthesizedMemo(
    op,
    env(daimoChainFromId(account.homeChainId)).chainConfig,
    i18NLocale
  );

  return (
    <View>
      <TitleAmount
        amount={BigInt(op.amount)}
        preSymbol={sentByUs ? "-" : "+"}
        style={sentByUs ? { color: "black" } : { color: color.success }}
      />
      <Spacer h={4} />
      <TouchableOpacity onPress={onShowHelp} hitSlop={8}>
        <TextCenter>
          <TextBodyCaps color={color.grayMid}>{subtitleElems}</TextBodyCaps>
        </TextCenter>
      </TouchableOpacity>
      {memoText && (
        <>
          <Spacer h={16} />
          <TextCenter>
            <TextBodyCaps color={color.grayMid}>{memoText}</TextBodyCaps>
          </TextCenter>
        </>
      )}
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

function getOpVerb(op: TransferClog, accountAddress: Address) {
  const isPayLink = op.type === "createLink" || op.type === "claimLink";
  const sentByUs = op.from === accountAddress;
  const isRequestResponse = op.type === "transfer" && op.requestStatus != null;

  if (isPayLink) {
    if (sentByUs) return i18.opVerb.createdLink();
    const fromUs = op.noteStatus.sender.addr === accountAddress;
    return fromUs ? i18.opVerb.cancelledLink() : i18.opVerb.acceptedLink();
  } else if (isRequestResponse) {
    return sentByUs
      ? i18.opVerb.fulfilledRequest()
      : i18.opVerb.receivedRequest();
  } else {
    return sentByUs ? i18.opVerb.sent() : i18.opVerb.received();
  }
}

function showHelpWhyNoFees(
  dispatcher: Dispatcher,
  chainName: string,
  foreignChainName?: string
) {
  const i1 = i18.whyNoFees;
  dispatcher.dispatch({
    name: "helpModal",
    title: i1.title(),
    content: (
      <View style={ss.container.padH8}>
        <TextPara>
          {foreignChainName
            ? i1.description.firstPara2Chain(chainName, foreignChainName)
            : i1.description.firstPara(chainName)}
        </TextPara>
        <Spacer h={24} />
        <TextPara>{i1.description.secondPara()}</TextPara>
        <Spacer h={24} />
        <TextPara>{i1.description.thirdPara()}</TextPara>
      </View>
    ),
  });
}

function getFeeText(amount?: number) {
  if (amount == null) {
    return i18.feeText.pending();
  }

  let feeStr = "$" + amountToDollars(amount);
  if (amount > 0 && feeStr === "$0.00") {
    feeStr = "< $0.01";
  }
  return amount === 0 ? i18.feeText.free() : i18.feeText.fee(feeStr);
}
