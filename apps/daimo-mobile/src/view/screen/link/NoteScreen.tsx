import {
  AddrLabel,
  DaimoNoteState,
  DaimoNoteStatus,
  EAccount,
  OpStatus,
  PendingOp,
  dollarsToAmount,
  getAccountName,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { SetActStatus } from "../../../action/actStatus";
import {
  transferAccountTransform,
  useSendWithDeviceKeyAsync,
} from "../../../action/useSendAsync";
import { ParamListHome, useExitBack } from "../../../common/nav";
import { i18NLocale, i18n } from "../../../i18n";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { useEphemeralSignature } from "../../../logic/note";
import { getRpcFunc } from "../../../logic/trpc";
import { Account } from "../../../storage/account";
import { TitleAmount, getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { CenterSpinner } from "../../shared/CenterSpinner";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ErrorBanner } from "../../shared/error";
import {
  TextBody,
  TextBold,
  TextCenter,
  TextError,
  TextLight,
} from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { useTheme } from "../../style/theme";

type Props = NativeStackScreenProps<ParamListHome, "Note">;
const i18 = i18n.note;

export default function NoteScreen(props: Props) {
  const Inner = useWithAccount(NoteScreenInner);
  return <Inner {...props} />;
}

function NoteScreenInner({ route, account }: Props & { account: Account }) {
  const { ss } = useTheme();
  const { link } = route.params;
  console.log(`[NOTE] rendering NoteScreen, link ${JSON.stringify(link)}`);

  // Connect to the relevant DaimoEphemeralNotes[V2] contract info
  const chain = daimoChainFromId(account.homeChainId);
  const noteFetch = useFetchLinkStatus(link, chain)!;
  const noteStatus = noteFetch.data as DaimoNoteStatus | undefined;

  const title = (function (): string {
    switch (noteStatus?.status) {
      case DaimoNoteState.Claimed:
        return i18.accepted.link();
      case DaimoNoteState.Cancelled:
        return i18.cancelled.link();
      default:
        return i18.payment();
    }
  })();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={title} onBack={useExitBack()} />
      <ScrollView bounces={false}>
        {noteFetch.isFetching && <CenterSpinner />}
        {noteFetch.error && (
          <ErrorBanner
            error={noteFetch.error}
            displayTitle={i18.invalid()}
            displayMessage={noteFetch.error.message}
          />
        )}
        {noteStatus && (
          <NoteDisplayInner
            {...{ account, noteStatus: { ...noteStatus, link } }}
          />
        )}
      </ScrollView>
    </View>
  );
}

interface NoteDisplayProps {
  noteStatus: DaimoNoteStatus;
}

/// Displays a note: amount, status, and button to claim.
export function NoteDisplay(
  props: NoteDisplayProps & { hideAmount?: boolean; leaveScreen?: () => void }
) {
  const Inner = useWithAccount(NoteDisplayInner);
  return <Inner {...props} />;
}

function NoteDisplayInner({
  account,
  noteStatus,
  hideAmount,
  leaveScreen,
}: NoteDisplayProps & {
  account: Account;
  hideAmount?: boolean;
  leaveScreen?: () => void;
}) {
  const { ss } = useTheme();

  // Where the note came from
  const sendPhrase =
    noteStatus.sender.addr === account.address
      ? i18.send.self()
      : i18.send.other(getAccountName(noteStatus.sender, i18NLocale));

  // The note itself and signature
  const ephemeralOwner = noteStatus.ephemeralOwner!;
  const ephemeralSignature = useEphemeralSignature(
    noteStatus.sender.addr,
    account.address,
    noteStatus.link.type === "note"
      ? noteStatus.link.ephemeralPrivateKey
      : undefined,
    noteStatus.link.type === "notev2" ? noteStatus.link.seed : undefined
  );

  const nonceMetadata = new DaimoNonceMetadata(DaimoNonceType.ClaimNote);
  const nonce = useMemo(() => new DaimoNonce(nonceMetadata), [ephemeralOwner]);

  const isV2RecipientClaim =
    noteStatus.link.type === "notev2" &&
    noteStatus.sender.addr !== account.address;
  const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
  const customHandler = isV2RecipientClaim
    ? async (setAS: SetActStatus) => {
        setAS("loading", i18.accept.loading());
        const txHash = await rpcFunc.claimEphemeralNoteSponsored.mutate({
          ephemeralOwner,
          recipient: account.address,
          signature: ephemeralSignature,
        });
        setAS("success", i18.accept.link());
        return { txHash } as PendingOp;
      }
    : undefined;

  const sendFn = async (opSender: DaimoOpSender) => {
    const opMetadata = {
      nonce,
      chainGasConstants: account.chainGasConstants,
    };
    if (noteStatus.contractAddress === opSender.opConfig.notesAddressV1) {
      console.log(`[ACTION] claiming note ${ephemeralOwner}`);
      return opSender.claimEphemeralNoteV1(
        ephemeralOwner,
        ephemeralSignature,
        opMetadata
      );
    } else {
      if (noteStatus.sender.addr === account.address) {
        console.log(`[ACTION] claiming notev2 self ${ephemeralOwner}`);
        return opSender.claimEphemeralNoteSelf(ephemeralOwner, opMetadata);
      } else {
        console.log(`[ACTION] claiming notev2 recipient ${ephemeralOwner}`);
        return opSender.claimEphemeralNoteRecipient(
          ephemeralOwner,
          ephemeralSignature,
          opMetadata
        );
      }
    }
  };

  const isOwnSentNote = noteStatus.sender.addr === account.address;

  const { status, message, cost, exec } = useSendWithDeviceKeyAsync({
    dollarsToSend: 0,
    sendFn,
    customHandler,
    pendingOp: {
      type: "claimLink",
      status: OpStatus.pending,
      from: noteStatus.contractAddress,
      to: account.address,
      amount: Number(dollarsToAmount(noteStatus.dollars)),
      timestamp: now(),
      nonceMetadata: nonceMetadata.toHex(),
      noteStatus: {
        ...noteStatus,
        status: isOwnSentNote
          ? DaimoNoteState.Cancelled
          : DaimoNoteState.Claimed,
        claimer: { addr: account.address, name: account.name },
      },
    },
    accountTransform: transferAccountTransform([
      {
        addr: noteStatus.contractAddress,
        label: AddrLabel.PaymentLink,
      } as EAccount,
      noteStatus.sender,
    ]),
  });
  console.log(
    `[NOTE] rendering NoteDisplay, status ${status} ${message} ${JSON.stringify(
      noteStatus
    )} ${ephemeralSignature}`
  );

  const netRecv = Math.max(0, Number(noteStatus.dollars) - cost.totalDollars);
  const netDollarsReceivedStr = getAmountText({ dollars: netRecv });

  // On success, go home, show newly created transaction
  const goBack = useExitBack();
  useEffect(() => {
    if (status !== "success") return;
    if (leaveScreen) leaveScreen();
    else goBack!();
  }, [status]);

  const statusMessage = (function (): ReactNode {
    switch (noteStatus.status) {
      case DaimoNoteState.Claimed:
        return (
          <TextBold>
            {i18.accepted.long(getAccountName(noteStatus.claimer!, i18NLocale))}
          </TextBold>
        );
      case DaimoNoteState.Cancelled:
        if (isOwnSentNote) {
          return <TextBody>{i18.cancelled.longSelf()}</TextBody>;
        } else {
          return <TextError>{i18.cancelled.longOther()}</TextError>;
        }
      case DaimoNoteState.Pending: // Note is not yet onchain.
        return <TextBody>{i18.pending.long()}</TextBody>;
      case DaimoNoteState.Confirmed: // Note is onchain, claimable, see below.
        break;
      default:
        throw new Error(`Unknown note status: ${noteStatus.status}`);
    }

    // Note is onchain, ready to claim.
    switch (status) {
      case "idle":
        if (netRecv === 0) {
          return i18.gasTooHigh();
        } else if (isOwnSentNote) {
          return i18.cancel.long(netDollarsReceivedStr);
        } else {
          return i18.accept.long(netDollarsReceivedStr);
        }
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  const button = (function () {
    // Pending notes are not yet claimable.
    // Claimed and cancelled notes are no longer claimable.
    // Only "confirmed" notes are claimable.
    const isClaimable = noteStatus.status === DaimoNoteState.Confirmed;
    const i18nButton = i18n.shared;

    switch (status) {
      case "idle":
        if (isOwnSentNote) {
          return (
            <ButtonBig
              type="primary"
              title={i18nButton.buttonAction.cancel()}
              onPress={exec}
              disabled={!isClaimable || netRecv === 0}
              showBiometricIcon
            />
          );
        } else {
          return (
            <ButtonBig
              type="primary"
              title={i18nButton.buttonAction.accept()}
              onPress={exec}
              disabled={!isClaimable || netRecv === 0}
            />
          );
        }
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return (
          <ButtonBig
            type="success"
            title={i18nButton.buttonStatus.success()}
            disabled
          />
        );
      case "error":
        return (
          <ButtonBig type="danger" title={i18nButton.buttonStatus.error()} />
        );
    }
  })();

  return (
    <>
      {!hideAmount && (
        <>
          <Spacer h={64} />
          <TextCenter>
            <TextLight>{sendPhrase}</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <TitleAmount amount={dollarsToAmount(noteStatus.dollars)} />
          {noteStatus.memo && (
            <>
              <Spacer h={8} />
              <TextCenter>
                <TextLight>{noteStatus.memo}</TextLight>
              </TextCenter>
            </>
          )}
          <Spacer h={32} />
        </>
      )}
      <View style={ss.container.padH16}>{button}</View>
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </>
  );
}
