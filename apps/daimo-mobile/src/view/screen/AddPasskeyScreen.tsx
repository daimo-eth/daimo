import { assert } from "@daimo/common";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useSendAsync } from "../../action/useSendAsync";
import { findUnusedSlot } from "../../logic/keySlot";
import { createPasskey } from "../../logic/passkey";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { TextCenter, TextError, TextLight } from "../shared/text";

export function AddPasskeyScreen() {
  const [account] = useAccount();
  assert(account != null);

  const nextSlot = findUnusedSlot(
    account.accountKeys.map((k) => k.slot),
    "Passkey"
  );

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    []
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    const pubKey = await createPasskey(account.name, nextSlot);
    console.log(`[ACTION] adding passkey ${pubKey}`);
    return opSender.addSigningKey(nextSlot, pubKey, {
      nonce,
      chainGasConstants: account.chainGasConstants,
    });
  };

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
  });

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Fee: ${getAmountText({ dollars: cost.totalDollars })}`;
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
        return <ButtonBig type="primary" title="Add Backup" onPress={exec} />;
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  return (
    <View style={styles.vertOuter}>
      <Spacer h={32} />
      {button}
      <Spacer h={32} />
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </View>
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    flex: 1,
    padding: 32,
    overflow: "hidden",
  },
});
