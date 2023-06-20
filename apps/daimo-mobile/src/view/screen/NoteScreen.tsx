import { tokenMetadata } from "@daimo/contract";
import { DaimoAccount } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useContext, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Address, createWalletClient, http, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseGoerli } from "viem/chains";

import { TxHandle, useSendAsync } from "../../action/useSendAsync";
import { assert } from "../../logic/assert";
import { ChainContext } from "../../logic/chain";
import { EphemeralNote, dummySignature, fetchNote } from "../../logic/note";
import { rpcFunc } from "../../logic/trpc";
import { useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { HomeStackParamList } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextCenter, TextError, TextSmall } from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Note">;

export default function NoteScreen({ route }: Props) {
  const [account] = useAccount();
  assert(account != null);
  const { chain } = useContext(ChainContext);
  assert(chain != null);

  const { ephemeralPrivateKey, ephemeralOwner: passedEphemeralOwner } =
    route.params || {};
  const ephemeralOwner =
    passedEphemeralOwner || privateKeyToAccount(ephemeralPrivateKey!).address;

  console.log(`[NOTE] rendering note ${ephemeralOwner}`);

  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [note, setNote] = useState<EphemeralNote | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const note = await fetchNote(chain.clientL2, ephemeralOwner);
      setNote(note);
      if (note) setLoadState("loaded");
      else setLoadState("error");
    })();
  }, [ephemeralOwner]);

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

  const chain = useContext(ChainContext);
  assert(chain != null);

  const [ephemeralSignature, setEphemeralSignature] =
    useState<`0x${string}`>("0x");

  useEffect(() => {
    (async () => {
      if (!ephemeralPrivateKey) {
        // Must be sender themselves reclaiming
        setEphemeralSignature(dummySignature);
        return;
      }
      const ephemeralAccount = privateKeyToAccount(ephemeralPrivateKey);
      const ephemeralClient = createWalletClient({
        account: ephemeralAccount,
        chain: baseGoerli,
        transport: http(),
      });
      const message = keccak256(account.address);
      const signature = await ephemeralClient.signMessage({
        message: { raw: message },
      });
      setEphemeralSignature(signature);
    })();
  }, [ephemeralPrivateKey, ephemeralNote]);

  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    (async () => {
      const name = await rpcFunc.resolveAddr.query({
        addr: ephemeralNote.from,
      });
      if (name) setSenderName(name);
    })();
  }, [ephemeralNote]);

  const createTxHandle = (
    ephemeralOwner: Address,
    signature: `0x${string}`
  ): TxHandle => {
    return async (account: DaimoAccount) => {
      console.log(
        `[ACTION] claiming note ${ephemeralOwner} ${signature} ${account}`
      );
      return account.claimEphemeralNote(ephemeralOwner, signature);
    };
  };

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    createTxHandle(ephemeralNote.owner, ephemeralSignature)
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
