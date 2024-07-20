import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { useEffect } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

import { ButtonMed } from "./Button";
import { i18n } from "../../i18n";
import { useScannerAccess } from "../../logic/scanner";

const i18 = i18n.scanner;

/** Scans a QR code. */
export function Scanner({
  handleBarCodeScanned,
}: {
  handleBarCodeScanned: BarCodeScannedCallback;
}) {
  const { permission, ask } = useScannerAccess();

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) ask();
  }, [permission?.granted, permission?.canAskAgain]);

  return !permission?.granted ? (
    <ButtonMed type="primary" title={i18.enableCamera()} onPress={ask} />
  ) : (
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
