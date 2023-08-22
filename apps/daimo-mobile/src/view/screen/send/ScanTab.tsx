import { daimoLinkBase, parseDaimoLink } from "@daimo/common";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { useState } from "react";
import { Linking, StyleSheet } from "react-native";

import { CancelHeader } from "./CancelHeader";
import { Scanner } from "../../shared/Scanner";
import Spacer from "../../shared/Spacer";

/** Scans a QR code to pay someone. */
export function ScanTab({ hide }: { hide: () => void }) {
  const [handled, setHandled] = useState(false);

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const daimoLink = parseDaimoLink(data);
    if (daimoLink == null) return;
    setHandled(true);

    let directLink: string;
    if (data.startsWith(daimoLinkBase + "/")) {
      directLink = "daimo://" + data.substring(daimoLinkBase.length + 1);
    } else {
      directLink = data;
    }

    console.log(`[SCAN] opening URL ${directLink}`);
    Linking.openURL(directLink);
  };

  return (
    <>
      <CancelHeader hide={hide}>Scan to pay</CancelHeader>
      <Spacer h={8} />
      <Scanner handleBarCodeScanned={handleBarCodeScanned} />
    </>
  );
}

const styles = StyleSheet.create({
  cameraBox: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
});
