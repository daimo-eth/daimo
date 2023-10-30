import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { ReactNode, useEffect, useState } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

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
          style={Platform.select<ViewStyle>({
            ios: StyleSheet.absoluteFillObject,
            android: styles.cameraAndroid,
          })}
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
  cameraAndroid: {
    position: "absolute",
    width: 400,
    height: 600,
    top: -150,
    left: -20,
  },
});
