import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { CancelHeader } from "./CancelHeader";
import { parseDaimoLink } from "../../../logic/link";
import { getRecipient } from "../../../sync/loadRecipients";
import Spacer from "../../shared/Spacer";
import { useNav } from "../../shared/nav";
import { TextBody } from "../../shared/text";

/** Scans a QR code to pay someone. */
export function ScanTab({ hide }: { hide: () => void }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync()
      .then(({ status }) => setHasPermission(status === "granted"))
      .catch((e) => console.error(e));
  }, []);

  const [handled, setHandled] = useState(false);
  const nav = useNav();

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const daimoLink = parseDaimoLink(data);
    if (daimoLink == null) return;
    setHandled(true);

    switch (daimoLink.type) {
      case "receive": {
        const recipient = await getRecipient(daimoLink.addr);
        nav.navigate("Send", { recipient });
        break;
      }
      default:
        throw new Error(`Unhandled daimo link type: ${daimoLink.type}`);
    }
  };

  let body: ReactNode;
  if (hasPermission === null) {
    body = <TextBody>Requesting for camera permission</TextBody>;
  } else if (hasPermission === false) {
    body = <TextBody>No access to camera</TextBody>;
  } else {
    body = (
      <View style={styles.cameraBox}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
        />
      </View>
    );
  }

  return (
    <>
      <CancelHeader hide={hide}>Scan to pay</CancelHeader>
      <Spacer h={8} />
      {body}
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
