import { OpStatus, assert } from "@daimo/common";
import { DaimoAccount, DaimoNonce, DaimoNonceMetadata } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { ReactNode, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Hex } from "viem";

import { useSendAsync } from "../../action/useSendAsync";
import { parseAddKeyString } from "../../logic/device";
import { useAccount } from "../../model/account";
import { ButtonBig } from "../shared/Button";
import { Header } from "../shared/Header";
import { Scanner } from "../shared/Scanner";
import { HomeStackParamList } from "../shared/nav";
import { ss } from "../shared/style";
import { TextCenter, TextError, TextLight } from "../shared/text";

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

  const [nonce] = useState(() => new DaimoNonce(new DaimoNonceMetadata())); // TODO rebase

  const sendFn = async (account: DaimoAccount) => {
    console.log(`[ACTION] adding device ${newPubKey}`);
    return account.addSigningKey(newPubKey, nonce);
  };

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    sendFn
  );

  // TODO: load estimated fees
  const fees = 0.05;

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Add fee: $${fees.toFixed(2)}`;
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
        return <ButtonBig type="primary" title="Add Key" onPress={exec} />;
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  return (
    <View style={ss.container.vertModal}>
      <Header />
      {!handled && <Scanner handleBarCodeScanned={handleBarCodeScanned} />}
      {handled && (
        <>
          <TextCenter>Scanned key: {newPubKey}</TextCenter>
          <TextCenter>
            {button}
            <TextLight>
              <TextCenter>{statusMessage}</TextCenter>
            </TextLight>
          </TextCenter>
        </>
      )}
    </View>
  );
}
