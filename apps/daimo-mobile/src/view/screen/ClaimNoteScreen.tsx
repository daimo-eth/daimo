import { tokenMetadata } from "@daimo/contract";
import { DaimoAccount } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useContext, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { SendOpFn, useSendAsync } from "../../action/useSendAsync";
import { assert } from "../../logic/assert";
import { ChainContext } from "../../logic/chain";
import {
  EphemeralNote,
  useEphemeralSignature,
  useFetchNote,
} from "../../logic/note";
import { rpcFunc } from "../../logic/trpc";
import { useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { HomeStackParamList } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextCenter, TextError, TextSmall } from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Note">;

export default function ClaimNoteScreen({ route }: Props) {
  const [account] = useAccount();
  assert(account != null);
  const { chain } = useContext(ChainContext);
  assert(chain != null);

  const { ephemeralPrivateKey, ephemeralOwner: passedEphemeralOwner } =
    route.params || {};
  const ephemeralOwner =
    passedEphemeralOwner || privateKeyToAccount(ephemeralPrivateKey!).address;

  console.log(`[NOTE] rendering note ${ephemeralOwner}`);

  const [note, loadState] = useFetchNote(chain.clientL2, ephemeralOwner);

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

  const { chain } = useContext(ChainContext);
  assert(chain != null);

  const ephemeralSignature = useEphemeralSignature(
    ephemeralPrivateKey,
    account.address
  );

  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    (async () => {
      const name = await rpcFunc.resolveAddr.query({
        addr: ephemeralNote.from,
      });
      if (name) setSenderName(name);
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
      return account.claimEphemeralNote(ephemeralOwner, signature);
    };
  };

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    sendFn(ephemeralNote.owner, ephemeralSignature)
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
        return <ButtonBig title="Claim money" onPress={exec} type="primary" />;
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig title="Success" disabled />;
      case "error":
        return <ButtonBig title="Error" disabled />;
    }
  })();

  return (
    <>
      <TextCenter>
        <TextSmall>{senderName} sent you</TextSmall>
      </TextCenter>
      <TitleAmount
        symbol="$"
        amount={ephemeralNote.amount}
        decimals={tokenMetadata.decimals}
        displayDecimals={2}
      />
      {button}
      <TextSmall>
        <TextCenter>{statusMessage}</TextCenter>
      </TextSmall>
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
