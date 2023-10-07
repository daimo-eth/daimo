import * as ExpoEnclave from "@daimo/expo-enclave";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Hex } from "viem";

import { SetActStatus } from "./actStatus";
import { createEnclaveKey, loadEnclaveKey } from "../logic/enclave";

function getKeySecurityMessage(hwSecLevel: ExpoEnclave.HardwareSecurityLevel) {
  switch (hwSecLevel) {
    case "SOFTWARE":
      return "Key generated in software";
    case "TRUSTED_ENVIRONMENT":
      return "Key generated in trusted hardware";
    case "HARDWARE_ENCLAVE":
      return Platform.OS === "ios"
        ? "🔒  Key generated in Secure Enclave"
        : "🔒  Key generated in hardware enclave";
  }
}

async function createKey(
  setAS: SetActStatus,
  enclaveKeyName: string,
  preFetchedHwSecLev: ExpoEnclave.HardwareSecurityLevel
) {
  setAS("idle", "Creating enclave key...");
  try {
    const pubKeyHex = await createEnclaveKey(enclaveKeyName);
    setAS("idle", getKeySecurityMessage(preFetchedHwSecLev));
    return pubKeyHex;
  } catch (e: any) {
    console.warn(`[ACCOUNT] ERROR: create key or get HW security level`, e);
    setAS("error", e.message);
    return undefined;
  }
}

async function loadKey(setAS: SetActStatus, enclaveKeyName: string) {
  setAS("idle", "Loading enclave key...");
  try {
    const ret = await loadEnclaveKey(enclaveKeyName);
    setAS("idle", getKeySecurityMessage(ret.hwSecLevel));
    return ret;
  } catch (e: any) {
    console.warn(`[ACCOUNT] ERROR: load key or get HW security level`, e);
    setAS("error", e.message);
    return undefined;
  }
}

export function useLoadOrCreateEnclaveKey(
  setAS: SetActStatus,
  enclaveKeyName: string
) {
  const [pubKeyHex, setPubKeyHex] = useState<Hex>();

  // Load or create enclave key immediately, in the idle state
  useEffect(() => {
    loadKey(setAS, enclaveKeyName).then((loadedKeyInfo) => {
      console.log(`[ACTION] loaded key info ${JSON.stringify(loadedKeyInfo)}`);
      if (loadedKeyInfo && !loadedKeyInfo.pubKeyHex) {
        createKey(setAS, enclaveKeyName, loadedKeyInfo.hwSecLevel).then(
          (newPublicKey) => {
            console.log(`[ACTION] created public key ${newPublicKey}`);
            setPubKeyHex(newPublicKey);
          }
        );
      } else setPubKeyHex(loadedKeyInfo?.pubKeyHex);
    });
  }, [enclaveKeyName]);

  return pubKeyHex;
}
