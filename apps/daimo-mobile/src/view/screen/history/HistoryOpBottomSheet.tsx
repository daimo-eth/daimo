import {
  DaimoLinkNoteV2,
  DaimoNoteState,
  DaimoNoteStatus,
  EAccount,
  OpStatus,
  PaymentLinkClog,
  TransferClog,
  TransferSwapClog,
  amountToDollars,
  assert,
  assertNotNull,
  daysUntil,
  getAccountName,
  getTransferSummary,
  getTransferClogStatus,
  getTransferClogType,
  tryOrNull,
} from "@daimo/common";
import {
  ChainConfig,
  daimoChainFromId,
  getChainDisplayName,
  getDAv2Chain,
} from "@daimo/contract";
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
import {
  canSendToContact,
  getTransferClogContact,
} from "../../../logic/daimoContacts";
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
import { FailedDot, PendingDot, ProcessingDot } from "../../shared/StatusDot";
import {
  TextBodyCaps,
  TextCenter,
  TextError,
  TextH3,
  TextPara,
} from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { SkinStyleSheet } from "../../style/skins";
import { useTheme } from "../../style/theme";
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
  const { ss } = useTheme();
  const setBottomSheetDetailHeight = useContext(SetBottomSheetDetailHeight);

  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  // A pending op always has an opHash (since its initiated by the user's
  // account).
  const { opHash, txHash } = route.params.op;
  // TODO: make this work for landline transfers
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

  const showOffchainOpArrivalTime =
    op.type === "transfer" &&
    op.offchainTransfer &&
    op.offchainTransfer.status === "processing" &&
    op.offchainTransfer.timeExpected;
  const showOffchainOpStatus =
    op.type === "transfer" &&
    op.offchainTransfer &&
    op.offchainTransfer.status === "failed" &&
    op.offchainTransfer.statusMessage;
  const showLinkToExplorer = op.txHash && !shareLinkAgain;

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title={getOpVerb(op, account.address)}
        onExit={leaveScreen}
        hideOfflineHeader
      />
      <TransferBody account={account} transferClog={op} />
      <Spacer h={36} />
      <View style={ss.container.padH16}>
        {showOffchainOpArrivalTime && <OffchainOpArrivalTime op={op} />}
        {showOffchainOpStatus && <OffchainOpStatus op={op} />}
        {showLinkToExplorer && <LinkToExplorer {...{ chainConfig }} op={op} />}
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

function OffchainOpArrivalTime({ op }: { op: TransferSwapClog }) {
  assert(op.offchainTransfer != null);
  assert(op.offchainTransfer.timeExpected != null);

  const arrivalTime = op.offchainTransfer.timeExpected;
  const arrivalTimeString = daysUntil(arrivalTime, i18NLocale, undefined, true);
  const text =
    op.offchainTransfer.transferType === "deposit"
      ? i18.fundArrivalTime.deposit()
      : i18.fundArrivalTime.withdrawal();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 8,
        paddingBottom: 16,
      }}
    >
      <ProcessingDot />
      <TextH3 style={{ marginLeft: 8 }}>
        {text} {arrivalTimeString}
      </TextH3>
    </View>
  );
}

function OffchainOpStatus({ op }: { op: TransferSwapClog }) {
  assert(op.offchainTransfer != null);
  if (!op.offchainTransfer.statusMessage) {
    return null;
  }

  const transferClogStatus = getTransferClogStatus(op);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 8,
        paddingBottom: 16,
      }}
    >
      {transferClogStatus === "pending" && <PendingDot />}
      {transferClogStatus === "processing" && <ProcessingDot />}
      {transferClogStatus === "failed" && <FailedDot />}
      <TextH3 style={{ marginLeft: 8 }}>
        {op.offchainTransfer.statusMessage}
      </TextH3>
    </View>
  );
}

function TransferBody({
  account,
  transferClog,
}: {
  account: Account;
  transferClog: TransferClog;
}) {
  const { ss, color } = useTheme();

  const nav = useNav();
  const address = account.address;

  const sentByUs = transferClog.from === address;

  const otherContact = getTransferClogContact(transferClog, address);

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  let coinName = chainConfig.tokenSymbol;
  let chainName = chainConfig.chainL2.name.toUpperCase();

  // Special case: if this transfer is from or to a different coin or chain
  let foreignChainName: string | undefined = undefined;
  if (transferClog.type === "transfer") {
    const coin =
      transferClog.preSwapTransfer?.coin || transferClog.postSwapTransfer?.coin;
    if (coin != null) {
      coinName = coin.symbol;
      const chain = tryOrNull(() => getDAv2Chain(coin.chainId));
      if (chain && chain.chainId !== chainConfig.chainL2.id) {
        foreignChainName = getChainDisplayName(chain);
        chainName = foreignChainName.toUpperCase();
      }
    }
  }

  // Help button to explain fees, chain, etc
  const dispatcher = useContext(DispatcherContext);
  const onShowHelp = useCallback(() => {
    showHelpWhyNoFees(
      dispatcher,
      transferClog,
      chainConfig.chainL2.name,
      ss,
      foreignChainName
    );
  }, [transferClog]);

  // Generate subtitle = fees, chain, other details
  const col = color.grayMid;
  const subtitleElems = [
    <React.Fragment key="coin">{coinName}</React.Fragment>,
    <React.Fragment key="chain">{chainName}</React.Fragment>,
    <React.Fragment key="fees">
      <TextBodyCaps color={col}>
        {transferClog.status === "pending"
          ? i18.feeText.pending()
          : getFeeText(transferClog.feeAmount)}
      </TextBodyCaps>
      <Spacer w={8} />
      <Octicons size={16} name="info" color={col} />
    </React.Fragment>,
  ];

  for (let i = subtitleElems.length - 1; i > 0; i--) {
    const spacerText = " • ";
    const space = <React.Fragment key={i}>{spacerText}</React.Fragment>;
    subtitleElems.splice(i, 0, space);
  }

  const opSummary = getTransferSummary(
    transferClog,
    env(daimoChainFromId(account.homeChainId)).chainConfig,
    i18NLocale
  );

  const viewAccount = () => {
    // TODO: Temporarily disallow landline bank accounts
    if (otherContact.type === "landlineBankAccount") return false;
    // TODO: change `navToAccountPage` to accept `DaimoContact`
    if (canSendToContact(otherContact))
      navToAccountPage(otherContact as EAccount, nav);
  };

  return (
    <View>
      <TitleAmount
        amount={BigInt(transferClog.amount)}
        preSymbol={sentByUs ? "-" : "+"}
        style={sentByUs ? { color: "black" } : { color: color.success }}
      />
      <Spacer h={4} />
      <TouchableOpacity onPress={onShowHelp} hitSlop={8}>
        <TextCenter>
          <TextBodyCaps color={color.grayMid}>{subtitleElems}</TextBodyCaps>
        </TextCenter>
      </TouchableOpacity>
      {opSummary && (
        <>
          <Spacer h={16} />
          <TextCenter>
            <TextBodyCaps color={color.grayMid}>{opSummary}</TextBodyCaps>
          </TextCenter>
        </>
      )}
      <Spacer h={32} />
      <AccountRow
        contact={otherContact}
        timestamp={transferClog.timestamp}
        viewAccount={viewAccount}
        status={getTransferClogStatus(transferClog)}
      />
    </View>
  );
}

function getOpVerb(op: TransferClog, accountAddress: Address) {
  const transferType = getTransferClogType(op);
  const isPayLink = op.type === "createLink" || op.type === "claimLink";
  const sentByUs = op.from === accountAddress;
  const isRequestResponse = op.type === "transfer" && op.requestStatus != null;
  const isLandline = transferType === "landline";

  if (isPayLink) {
    if (sentByUs) return i18.opVerb.createdLink();
    const fromUs = op.noteStatus.sender.addr === accountAddress;
    return fromUs ? i18.opVerb.cancelledLink() : i18.opVerb.acceptedLink();
  } else if (isRequestResponse) {
    return sentByUs
      ? i18.opVerb.fulfilledRequest()
      : i18.opVerb.receivedRequest();
  } else if (isLandline) {
    const llTransfer = assertNotNull((op as TransferSwapClog).offchainTransfer);
    if (llTransfer.transferType === "deposit") {
      return llTransfer.status === "completed"
        ? i18.opVerb.deposited()
        : i18.opVerb.depositing();
    } else {
      return llTransfer.status === "completed"
        ? i18.opVerb.withdrew()
        : i18.opVerb.withdrawing();
    }
  } else {
    return sentByUs ? i18.opVerb.sent() : i18.opVerb.received();
  }
}

function showHelpWhyNoFees(
  dispatcher: Dispatcher,
  transferClog: TransferClog,
  chainName: string,
  ss: SkinStyleSheet,
  foreignChainName?: string
) {
  const i1 = i18.help;

  const transferType = getTransferClogType(transferClog);

  const content = () => {
    if (transferType === "landline") {
      const landlineTransferType = (transferClog as TransferSwapClog)
        .offchainTransfer!.transferType;
      const isCompleted =
        (transferClog as TransferSwapClog).offchainTransfer!.status ===
        "completed";

      if (landlineTransferType === "deposit") {
        if (isCompleted) {
          return (
            <View style={ss.container.padH8}>
              <TextPara>{i1.landlineDepositCompleted.firstPara()}</TextPara>
              <Spacer h={24} />
              <TextPara>{i1.landlineDepositCompleted.secondPara()}</TextPara>
            </View>
          );
        } else {
          return (
            <View style={ss.container.padH8}>
              <TextPara>{i1.landlineDepositProcessing.firstPara()}</TextPara>
              <Spacer h={24} />
              <TextPara>{i1.landlineDepositProcessing.secondPara()}</TextPara>
              <Spacer h={24} />
              <TextPara>{i1.landlineDepositProcessing.thirdPara()}</TextPara>
            </View>
          );
        }
      } else {
        if (isCompleted) {
          return (
            <View style={ss.container.padH8}>
              <TextPara>{i1.landlineWithdrawalCompleted.firstPara()}</TextPara>
              <Spacer h={24} />
              <TextPara>{i1.landlineWithdrawalCompleted.secondPara()}</TextPara>
            </View>
          );
        } else {
          return (
            <View style={ss.container.padH8}>
              <TextPara>{i1.landlineWithdrawalProcessing.firstPara()}</TextPara>
              <Spacer h={24} />
              <TextPara>
                {i1.landlineWithdrawalProcessing.secondPara()}
              </TextPara>
              <Spacer h={24} />
              <TextPara>{i1.landlineWithdrawalProcessing.thirdPara()}</TextPara>
            </View>
          );
        }
      }
    } else {
      return (
        <View style={ss.container.padH8}>
          <TextPara>
            {foreignChainName
              ? i1.whyNoFees.firstPara2Chain(chainName, foreignChainName)
              : i1.whyNoFees.firstPara(chainName)}
          </TextPara>
          <Spacer h={24} />
          <TextPara>{i1.whyNoFees.secondPara()}</TextPara>
          <Spacer h={24} />
          <TextPara>{i1.whyNoFees.thirdPara()}</TextPara>
        </View>
      );
    }
  };

  dispatcher.dispatch({
    name: "helpModal",
    title: i1.title(),
    content: content(),
  });
}

function getFeeText(amount?: number) {
  if (amount == null) {
    return i18.feeText.free();
  }

  let feeStr = "$" + amountToDollars(amount);
  if (amount > 0 && feeStr === "$0.00") {
    feeStr = "< $0.01";
  }
  return amount === 0 ? i18.feeText.free() : i18.feeText.fee(feeStr);
}
