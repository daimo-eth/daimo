import {
  OpStatus,
  assert,
  getAccountName,
  hasAccountName,
} from "@daimo/common";
import { ephemeralNotesAddress } from "@daimo/contract";
import { DaimoAccount, DaimoNonce, DaimoNonceMetadata } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Address } from "viem";

import { SendOpFn, useSendAsync } from "../../../action/useSendAsync";
import {
  EphemeralNote,
  useEphemeralSignature,
  useFetchNote,
} from "../../../logic/note";
import { rpcFunc } from "../../../logic/trpc";
import { useAccount } from "../../../model/account";
import { TitleAmount } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { HomeStackParamList } from "../../shared/nav";
import { color, ss } from "../../shared/style";
import { TextCenter, TextError, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Note">;

export default function NoteScreen({ route }: Props) {
  const [account] = useAccount();
  assert(account != null);

  const { ephemeralPrivateKey, ephemeralOwner } = route.params;
  console.log(`[NOTE] rendering note ${ephemeralOwner}`);

  // TODO: delete useFetchNote etc, use rpcFunc.getLinkStatus
  const [note, loadState] = useFetchNote(ephemeralOwner);

  return (
    <ScrollView contentContainerStyle={styles.vertOuter} bounces={false}>
      {loadState === "loading" && <Spinner />}
      {loadState === "error" && <ErrorDisplay />}
      {loadState === "loaded" && note && (
        <NoteDisplay
          ephemeralNote={note}
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

function ErrorDisplay() {
  return (
    <>
      {/** TODO: improve message and reporting */}
      <TextError>Invalid note. May have been claimed already.</TextError>
    </>
  );
}

function NoteDisplay({
  ephemeralNote,
  ephemeralPrivateKey,
}: {
  ephemeralNote: EphemeralNote;
  ephemeralPrivateKey: `0x${string}` | undefined;
}) {
  const [account] = useAccount();
  assert(account != null);

  const ephemeralSignature = useEphemeralSignature(
    ephemeralPrivateKey,
    account.address
  );

  const [senderName, setSenderName] = useState("");
  const nonce = new DaimoNonce(new DaimoNonceMetadata(!account.isDeployed));

  useEffect(() => {
    (async () => {
      const acc = await rpcFunc.getEthereumAccount.query({
        addr: ephemeralNote.from,
      });
      if (hasAccountName(acc)) {
        setSenderName(getAccountName(acc));
      }
    })();
  }, [ephemeralNote]);

  const sendFn = (
    ephemeralOwner: Address,
    signature: `0x${string}`
  ): SendOpFn => {
    return async (account: DaimoAccount) => {
      console.log(
        `[ACTION] claiming note ${ephemeralOwner} ${signature} ${account}`
      );
      return account.claimEphemeralNote(ephemeralOwner, signature, nonce);
    };
  };

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    sendFn(ephemeralNote.owner, ephemeralSignature),
    {
      type: "transfer",
      status: OpStatus.pending,
      from: ephemeralNotesAddress,
      to: account.address,
      amount: Number(ephemeralNote.amount),
      timestamp: Date.now() / 1e3,
    }
  );

  // TODO: load estimated fees
  // NOTE: These fees seem difficult to communicate to user, think about it.
  const fees = 0.05;

  const statusMessage = (function (): ReactNode {
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
    switch (status) {
      case "idle":
        return <ButtonBig type="primary" title="Claim money" onPress={exec} />;
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
        <TextLight>{senderName} sent you</TextLight>
      </TextCenter>
      <TitleAmount amount={ephemeralNote.amount} />
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
