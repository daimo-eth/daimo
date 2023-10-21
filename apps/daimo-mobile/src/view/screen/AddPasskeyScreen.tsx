import { assert } from "@daimo/common";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useMemo } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { useSendAsync } from "../../action/useSendAsync";
import { findUnusedSlot } from "../../logic/keySlot";
import { createPasskey } from "../../logic/passkey";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import {
  TextBody,
  TextBold,
  TextCenter,
  TextError,
  TextH1,
  TextLight,
} from "../shared/text";

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
        return (
          <ButtonBig type="primary" title="Create Backup" onPress={exec} />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  const cloudName =
    Platform.OS === "ios" ? "iCloud Keychain" : "Google Password Manager";

  return (
    <View style={styles.vertOuter}>
      <TextCenter>
        <TextH1>Backup account</TextH1>
      </TextCenter>
      <Spacer h={32} />
      <TextBody>
        Backup your account by storing a passkey in {cloudName}. This will allow
        you to recover your account from any device signed into your cloud
        account even if you lose this device.
      </TextBody>
      <Spacer h={32} />
      {button}
      <Spacer h={16} />
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
