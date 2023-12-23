import {
  AddrLabel,
  DaimoNoteState,
  DaimoNoteStatus,
  EAccount,
  OpStatus,
  assert,
  dollarsToAmount,
  getAccountName,
} from "@daimo/common";
import { daimoChainFromId, daimoEphemeralNotesAddress } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import {
  transferAccountTransform,
  useSendAsync,
} from "../../../action/useSendAsync";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { useEphemeralSignature } from "../../../logic/note";
import { Account } from "../../../model/account";
import { TitleAmount, getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ParamListReceive,
  useDisableTabSwipe,
  useExitToHome,
  useNav,
} from "../../shared/nav";
import { ss } from "../../shared/style";
import {
  TextBody,
  TextBold,
  TextCenter,
  TextError,
  TextLight,
} from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListReceive, "Note">;

export default function NoteScreen(props: Props) {
  const Inner = useWithAccount(NoteScreenInner);
  return <Inner {...props} />;
}

function NoteScreenInner({ route, account }: Props & { account: Account }) {
  const nav = useNav();
  useDisableTabSwipe(nav);

  const { link } = route.params;
  console.log(`[NOTE] rendering NoteScreen, link ${JSON.stringify(link)}`);

  const noteFetch = useFetchLinkStatus(
    link,
    daimoChainFromId(account.homeChainId)
  )!;

  const noteStatus = noteFetch.data as DaimoNoteStatus | undefined;

  const title = (function (): string {
    switch (noteStatus?.status) {
      case DaimoNoteState.Claimed:
        return "Claimed Link";
      case DaimoNoteState.Cancelled:
        return "Cancelled Link";
      default:
        return "Payment Link";
    }
  })();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={title} onExit={useExitToHome()} />
      <ScrollView bounces={false}>
        {noteFetch.isFetching && <Spinner />}
        {noteFetch.error && <TextError>{noteFetch.error.message}</TextError>}
        {noteStatus && (
          <NoteDisplay {...{ account, noteStatus: { ...noteStatus, link } }} />
        )}
      </ScrollView>
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

interface NoteDisplayProps {
  noteStatus: DaimoNoteStatus;
}

/// Displays a note: amount, status, and button to claim.
export function NoteDisplay(
  props: NoteDisplayProps & { hideAmount?: boolean }
) {
  const Inner = useWithAccount(NoteDisplayInner);
  return <Inner {...props} />;
}

function NoteDisplayInner({
  account,
  noteStatus,
  hideAmount,
}: NoteDisplayProps & { account: Account; hideAmount?: boolean }) {
  // Where the note came from
  const sendPhrase =
    noteStatus.sender.addr === account.address
      ? "You sent"
      : getAccountName(noteStatus.sender) + " sent";

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

  const sendFn = async (opSender: DaimoOpSender) => {
    console.log(`[ACTION] claiming note ${ephemeralOwner}`);
    return opSender.claimEphemeralNote(ephemeralOwner, ephemeralSignature, {
      nonce,
      chainGasConstants: account.chainGasConstants,
    });
  };

  const isOwnSentNote = noteStatus.sender.addr === account.address;

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
    pendingOp: {
      type: "claimLink",
      status: OpStatus.pending,
      from: daimoEphemeralNotesAddress,
      to: account.address,
      amount: Number(dollarsToAmount(noteStatus.dollars)),
      timestamp: Date.now() / 1e3,
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
        addr: daimoEphemeralNotesAddress,
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
  const goHome = useExitToHome();
  useEffect(() => {
    if (status !== "success") return;
    goHome();
  }, [status]);

  const statusMessage = (function (): ReactNode {
    switch (noteStatus.status) {
      case DaimoNoteState.Claimed:
        return (
          <TextBold>Claimed by {getAccountName(noteStatus.claimer!)}</TextBold>
        );
      case DaimoNoteState.Cancelled:
        assert(isOwnSentNote, "cancelled note not sent by user");
        return <TextBody>You reclaimed this payment link</TextBody>;
      default:
      // Pending note, available to claim
    }
    switch (status) {
      case "idle":
        if (netRecv === 0) {
          return `Gas too high to claim`;
        } else if (isOwnSentNote) {
          return `Cancel this link, reclaiming ${netDollarsReceivedStr}`;
        } else {
          return `Claim this link, receiving ${netDollarsReceivedStr}`;
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

    switch (status) {
      case "idle":
        if (isOwnSentNote) {
          return (
            <ButtonBig
              type="primary"
              title="Reclaim"
              onPress={exec}
              disabled={!isClaimable || netRecv === 0}
            />
          );
        } else {
          return (
            <ButtonBig
              type="primary"
              title="Accept"
              onPress={exec}
              disabled={!isClaimable || netRecv === 0}
            />
          );
        }
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
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
