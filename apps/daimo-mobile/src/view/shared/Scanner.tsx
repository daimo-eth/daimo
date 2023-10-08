import { BarCodeScanner, BarCodeScannedCallback } from "expo-barcode-scanner";
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { TextBody, TextCenter } from "./text";

/** Scans a QR code. */
export function Scanner({
  handleBarCodeScanned,
}: {
  handleBarCodeScanned: BarCodeScannedCallback;
}) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync()
      .then(({ status }) => setHasPermission(status === "granted"))
      .catch((e) => console.error(e));
  }, []);

  let body: ReactNode;
  if (hasPermission === null) {
    body = (
      <TextCenter>
        <TextBody>Requesting camera access</TextBody>
      </TextCenter>
    );
  } else if (hasPermission === false) {
    body = (
      <TextCenter>
        <TextBody>Allow camera access in Settings</TextBody>
      </TextCenter>
    );
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

  return body;
}

const styles = StyleSheet.create({
  cameraBox: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
});
