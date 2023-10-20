import {
  DaimoLinkNote,
  DaimoNoteStatus,
  OpStatus,
  assert,
  dollarsToAmount,
  getAccountName,
} from "@daimo/common";
import { daimoEphemeralNotesAddress } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { useSendAsync } from "../../../action/useSendAsync";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { useEphemeralSignature } from "../../../logic/note";
import { useAccount } from "../../../model/account";
import { TitleAmount, getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { ParamListReceive, useNav } from "../../shared/nav";
import { color, ss } from "../../shared/style";
import { TextBold, TextCenter, TextError, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListReceive, "Note">;

export default function NoteScreen({ route }: Props) {
  const [account] = useAccount();
  assert(account != null);

  const { link } = route.params;
  const { ephemeralPrivateKey, ephemeralOwner } = link as DaimoLinkNote;
  console.log(`[NOTE] rendering note ${ephemeralOwner}`);

  const noteStatus = useFetchLinkStatus(link)!;

  return (
    <ScrollView contentContainerStyle={styles.vertOuter} bounces={false}>
      {noteStatus.isFetching && <Spinner />}
      {noteStatus.error && <TextError>{noteStatus.error.message}</TextError>}
      {noteStatus.data && (
        <NoteDisplay
          noteStatus={noteStatus.data as DaimoNoteStatus}
          ephemeralPrivateKey={ephemeralPrivateKey}
        />
      )}
    </ScrollView>
  );
}

function Spinner() {
  return (
    <View style={ss.container.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function NoteDisplay({
  noteStatus,
  ephemeralPrivateKey,
}: {
  noteStatus: DaimoNoteStatus;
  ephemeralPrivateKey: `0x${string}` | undefined;
}) {
  const [account] = useAccount();
  assert(account != null);

  // Where the note came from
  const senderName = getAccountName(noteStatus.sender);

  // The note itself
  const { ephemeralOwner } = noteStatus.link;

  // Signature to claim the note
  const ephemeralSignature = useEphemeralSignature(
    noteStatus.sender.addr,
    account.address,
    ephemeralPrivateKey
  );

  const nonceMetadata = new DaimoNonceMetadata(DaimoNonceType.ClaimNote);
  const nonce = useMemo(
    () => new DaimoNonce(nonceMetadata),
    [ephemeralOwner, ephemeralPrivateKey]
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    console.log(`[ACTION] claiming note ${ephemeralOwner}`);
    return opSender.claimEphemeralNote(ephemeralOwner, ephemeralSignature, {
      nonce,
      chainGasConstants: account.chainGasConstants,
    });
  };

  // Add pending transaction immmmediately
  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
    pendingOp: {
      type: "transfer",
      status: OpStatus.pending,
      from: daimoEphemeralNotesAddress,
      to: account.address,
      amount: Number(dollarsToAmount(noteStatus.dollars)),
      timestamp: Date.now() / 1e3,
      nonceMetadata: nonceMetadata.toHex(),
    },
  });

  const netRecv = Math.max(0, Number(noteStatus.dollars) - cost.totalDollars);
  const netDollarsReceivedStr = getAmountText({ dollars: netRecv });
  const isOwnSentNote = noteStatus.sender.addr === account.address;

  // On success, go home, show newly created transaction
  const nav = useNav();
  useEffect(() => {
    if (status !== "success") return;
    nav.navigate("HomeTab", { screen: "Home" });
  }, [status]);

  const statusMessage = (function (): ReactNode {
    switch (noteStatus.status) {
      case "claimed":
        return (
          <TextBold>Claimed by {getAccountName(noteStatus.claimer!)}</TextBold>
        );
      case "cancelled":
        return <TextError>Cancelled by sender</TextError>;
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
    switch (noteStatus.status) {
      case "claimed":
      case "cancelled":
        return null;
      default:
      // Pending note, available to claim
    }
    switch (status) {
      case "idle":
        if (isOwnSentNote) {
          return (
            <ButtonBig
              type="primary"
              title="Reclaim"
              onPress={exec}
              disabled={netRecv === 0}
            />
          );
        } else {
          return (
            <ButtonBig
              type="primary"
              title="Claim"
              onPress={exec}
              disabled={netRecv === 0}
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
      <TextCenter>
        <TextLight>{senderName} sent</TextLight>
      </TextCenter>
      <TitleAmount amount={dollarsToAmount(noteStatus.dollars)} />
      {button}
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </>
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    backgroundColor: color.white,
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
});
