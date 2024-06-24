import { assertNotNull } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as ExpoEnclave from "@daimo/expo-enclave";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import { Platform, Share, ShareContent } from "react-native";

import { getDebugLog } from "./debugLog";
import { env } from "../env";
import { getAccountManager } from "../logic/accountManager";
import { getHardwareSec } from "../logic/enclave";
import { Account, serializeAccount } from "../storage/account";
import { amountSeparator } from "../view/shared/Amount";
import { ButtonMed } from "../view/shared/Button";

export function SendDebugLogButton() {
  const [sendDebugLog] = useSendDebugLog();
  return (
    <ButtonMed title="SEND DEBUG LOG" onPress={sendDebugLog} type="subtle" />
  );
}

/**
 * Returns a function to send a complete debug log + env summary.
 * Additionally returns the env summary for display.
 */
export function useSendDebugLog(
  account?: Account | null
): [() => Promise<void>, Record<string, string>] {
  if (account === undefined) {
    account = getAccountManager().getAccount();
  }

  // Get security level of key storage.
  const [sec, setSec] = useState<Awaited<ReturnType<typeof getHardwareSec>>>();
  useEffect(() => {
    getHardwareSec().then(setSec);
  }, []);

  // Get phone and app info.
  const daimoChain = daimoChainFromId(account?.homeChainId || 84532);
  const envObj = env(daimoChain);
  const envKV: Record<string, string> = {
    Platform: `${Platform.OS} ${Platform.Version} ${envObj.deviceType}`,
    Version: `${envObj.nativeApplicationVersion} #${envObj.nativeBuildVersion}`,
    Commit: `${envObj.gitHash} ${envObj.buildProfile}`,
    Notifications: account?.pushToken ? "enabled" : "disabled",
  };
  if (sec) {
    envKV["Key Security"] = getKeySecDescription(sec);
  }

  const sendDebugLog = async () => {
    const env = JSON.stringify({ ...envKV, amountSeparator }, null, 2);
    const accountJSON = account ? serializeAccount(account) : "no account";
    const debugLog = getDebugLog([env, accountJSON]);

    let content: ShareContent;
    if (Platform.OS === "ios") {
      const fileName = `debug-${account?.name || "onboarding"}.log`;
      const debugLogUri = assertNotNull(FileSystem.cacheDirectory) + fileName;
      await FileSystem.writeAsStringAsync(debugLogUri, debugLog);
      content = {
        title: "Send Debug Log",
        url: debugLogUri,
      };
    } else {
      content = {
        title: "Send Debug Log",
        message: debugLog,
      };
    }

    Share.share(content, { subject: "Daimo Debug Log" });
  };

  return [sendDebugLog, envKV];
}
function getKeySecDescription(
  hardwareSecurityLevel: ExpoEnclave.HardwareSecurityLevel
) {
  switch (hardwareSecurityLevel) {
    case "SOFTWARE":
      return "software key";
    case "TRUSTED_ENVIRONMENT":
      return "Android TEE";
    case "HARDWARE_ENCLAVE":
      return "secure enclave";
    default:
      return `${hardwareSecurityLevel}`;
  }
}
