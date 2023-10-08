import { daimoLinkBase, parseDaimoLink } from "@daimo/common";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { useState } from "react";
import { Linking } from "react-native";

import { Scanner } from "../../shared/Scanner";
import Spacer from "../../shared/Spacer";

/** Scans a QR code to pay someone. */
export function ScanTab() {
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
      <Spacer h={16} />
      <Scanner handleBarCodeScanned={handleBarCodeScanned} />
    </>
  );
}
