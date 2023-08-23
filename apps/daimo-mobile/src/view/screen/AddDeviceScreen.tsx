import { assert } from "@daimo/common";
import {
  DaimoAccount,
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
} from "@daimo/userop";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { ReactNode, useMemo, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Hex } from "viem";

import { useSendAsync } from "../../action/useSendAsync";
import { parseAddKeyString, pubKeyToEmoji } from "../../logic/device";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { Scanner } from "../shared/Scanner";
import Spacer from "../shared/Spacer";
import {
  TextBold,
  TextCenter,
  TextError,
  TextH2,
  TextLight,
} from "../shared/text";

export function AddDeviceScreen() {
  const [account] = useAccount();
  assert(account != null);

  const [handled, setHandled] = useState(false);
  const [newPubKey, setNewPubKey] = useState<Hex>("0x");

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const pubkeyHex = parseAddKeyString(data); // TODO: handle errors gracefully
    setHandled(true);

    console.log(`[SCAN] got key ${pubkeyHex}`);
    setNewPubKey(pubkeyHex);
  };

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    [newPubKey]
  );

  const sendFn = async (account: DaimoAccount) => {
    console.log(`[ACTION] adding device ${newPubKey}`);
    return account.addSigningKey(newPubKey, nonce);
  };

  const { status, message, cost, exec } = useSendAsync({
    enclaveKeyName: account.enclaveKeyName,
    dollarsToSend: 0,
    sendFn,
  });

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Add fee: ${getAmountText({ dollars: cost.totalDollars })}`;
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
        return <ButtonBig type="primary" title="Add Device" onPress={exec} />;
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
      {!handled && <Scanner handleBarCodeScanned={handleBarCodeScanned} />}
      {handled && (
        <>
          <TextCenter>
            <TextH2>
              Scanned <TextBold>Device {pubKeyToEmoji(newPubKey)}</TextBold>
            </TextH2>
          </TextCenter>
          <Spacer h={16} />
          {button}
          <TextCenter>
            <TextLight>
              <TextCenter>{statusMessage}</TextCenter>
            </TextLight>
          </TextCenter>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
});
