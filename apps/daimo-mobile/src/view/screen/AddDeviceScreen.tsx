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
import {
  findUnusedSlot,
  keySlotToDeviceIdentifier,
  parseAddDeviceString,
} from "../../logic/device";
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

  const [newKey, setNewKey] = useState<Hex>();
  const nextSlot = findUnusedSlot(account.accountKeys.map((k) => k.slot));
  const [barCodeStatus, setBarCodeStatus] = useState<
    "idle" | "error" | "scanned"
  >("idle");

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (barCodeStatus !== "idle") return;

    try {
      const parsedKey = parseAddDeviceString(data);
      setBarCodeStatus("scanned");

      console.log(`[SCAN] got key ${parsedKey}`);
      setNewKey(parsedKey);
    } catch (e) {
      console.error(`[SCAN] error parsing QR code: ${e}`);
      setBarCodeStatus("error");
    }
  };

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    [newKey]
  );

  const sendFn = async (account: DaimoAccount) => {
    if (!newKey) throw new Error("no key?");
    console.log(`[ACTION] adding device ${newKey}`);
    return account.addSigningKey(nextSlot, newKey, nonce);
  };

  const { status, message, cost, exec } = useSendAsync({
    enclaveKeyName: account.enclaveKeyName,
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
      {barCodeStatus === "idle" && (
        <Scanner handleBarCodeScanned={handleBarCodeScanned} />
      )}
      {barCodeStatus === "error" && (
        <TextCenter>
          <TextH2>Error Parsing QR Code</TextH2>
        </TextCenter>
      )}
      {barCodeStatus === "scanned" && newKey && (
        <>
          <TextCenter>
            <TextH2>
              Scanned{" "}
              <TextBold>Device {keySlotToDeviceIdentifier(nextSlot)}</TextBold>
            </TextH2>
          </TextCenter>
          <Spacer h={32} />
          {button}
          <Spacer h={32} />
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
    overflow: "hidden",
  },
});
