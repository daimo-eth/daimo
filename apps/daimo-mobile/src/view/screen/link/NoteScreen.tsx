import {
  DaimoNoteStatus,
  OpStatus,
  assert,
  dollarsToAmount,
  getAccountName,
} from "@daimo/common";
import { ephemeralNotesAddress } from "@daimo/contract";
import { DaimoAccount, DaimoNonce, DaimoNonceMetadata } from "@daimo/userop";
import { DaimoNonceType } from "@daimo/userop/dist/src/nonce";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { useSendAsync } from "../../../action/useSendAsync";
import { useEphemeralSignature, useFetchNote } from "../../../logic/note";
import { useAccount } from "../../../model/account";
import { TitleAmount } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { HomeStackParamList, useNav } from "../../shared/nav";
import { color, ss } from "../../shared/style";
import { TextBold, TextCenter, TextError, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Note">;

export default function NoteScreen({ route }: Props) {
  const [account] = useAccount();
  assert(account != null);

  const { ephemeralPrivateKey, ephemeralOwner } = route.params;
  console.log(`[NOTE] rendering note ${ephemeralOwner}`);

  const res = useFetchNote(ephemeralOwner);

  return (
    <ScrollView contentContainerStyle={styles.vertOuter} bounces={false}>
      {res.isFetching && <Spinner />}
      {res.error && <TextError>{res.error.message}</TextError>}
      {res.data && (
        <NoteDisplay
          noteStatus={res.data as DaimoNoteStatus}
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
    ephemeralPrivateKey,
    account.address
  );

  const nonceMetadata = new DaimoNonceMetadata(DaimoNonceType.ClaimNote);
  const nonce = useMemo(
    () => new DaimoNonce(nonceMetadata),
    [nonceMetadata, ephemeralOwner, ephemeralPrivateKey]
  );

  const sendFn = async (account: DaimoAccount) => {
    console.log(`[ACTION] claiming note ${ephemeralOwner}`);
    return account.claimEphemeralNote(
      ephemeralOwner,
      ephemeralSignature,
      nonce
    );
  };

  // Add pending transaction immmmediately
  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    sendFn,
    {
      type: "transfer",
      status: OpStatus.pending,
      from: ephemeralNotesAddress,
      to: account.address,
      amount: Number(dollarsToAmount(noteStatus.dollars)),
      timestamp: Date.now() / 1e3,
      nonceMetadata: nonceMetadata.toHex(),
    }
  );

  // On success, go home, show newly created transaction
  const nav = useNav();
  useEffect(() => {
    if (status !== "success") return;
    nav.navigate("Home");
  }, [status]);

  // TODO: load estimated fees
  // NOTE: These fees seem difficult to communicate to user, think about it.
  const fees = 0.05;

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
        return `Claim fee: $${fees.toFixed(2)}`;
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
        if (noteStatus.sender.addr === account.address) {
          return <ButtonBig type="primary" title="Cancel" onPress={exec} />;
        } else {
          return (
            <ButtonBig type="primary" title="Claim money" onPress={exec} />
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
      <TextLight>
        <TextCenter>{statusMessage}</TextCenter>
      </TextLight>
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
