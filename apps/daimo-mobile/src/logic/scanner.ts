import * as BarCodeScanner from "expo-barcode-scanner";
import { useEffect, useState } from "react";

import { askOpenSettings } from "./settings";

interface ScannerAccess {
  permission: BarCodeScanner.PermissionResponse | undefined;
  ask: () => Promise<void>;
}

export function useScannerAccess(): ScannerAccess {
  const [permission, setPermission] = useState<
    BarCodeScanner.PermissionResponse | undefined
  >();

  const fetchPermissions = async () => {
    await BarCodeScanner.getPermissionsAsync().then(setPermission);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const ask = async () => {
    // Refresh permission state before prompting.
    const latestPermission = await BarCodeScanner.getPermissionsAsync();

    if (!latestPermission.granted) {
      await requestScannerAccess(latestPermission.canAskAgain);
    }

    fetchPermissions();
  };

  return { permission, ask };
}

// Ask for push camera access, either via a direct prompt or by asking
// to open system settings.
async function requestScannerAccess(canAskAgain: boolean) {
  if (canAskAgain) await BarCodeScanner.requestPermissionsAsync();
  else {
    await askOpenSettings("camera", () => {});
  }
}
