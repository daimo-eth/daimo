import { assertNotNull } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as ExpoEnclave from "@daimo/expo-enclave";
import * as FileSystem from "expo-file-system";
import { useState, useEffect } from "react";
import { Platform, ShareContent, Share } from "react-native";

import { getHardwareSec } from "./logic/enclave";
import { env } from "./logic/env";
import { Account, getAccountManager, serializeAccount } from "./model/account";
import { amountSeparator } from "./view/shared/Amount";

const n = 400;
const logs: string[] = [];

// Hooks console.log, saves a rolling log of the last n lines.
export function initDebugLog() {
  console.log = createLogFunc("log", console.log);
  console.warn = createLogFunc("WRN", console.warn);
  console.error = createLogFunc("ERR", console.error);
}

function createLogFunc(type: string, oldLog: (...args: any[]) => void) {
  return (...args: any[]) => {
    // Print to console in local development.
    oldLog(...args);

    // Save to rolling buffer.
    const timestamp = new Date().toISOString();
    const parts = args.map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.stack || a.toString();
      try {
        return JSON.stringify(a);
      } catch {
        return "" + a;
      }
    });
    let line = [timestamp, type, ...parts].join(" ");
    if (line.length > 5000) line = line.slice(0, 5000) + "...";
    logs.push(line);

    // Don't let the buffer get too long
    if (logs.length > n) logs.shift();
  };
}

export function getDebugLog(headerLines: string[]) {
  const now = new Date().toISOString();
  const log = logs.join("\n") + `\n${now} - debug log captured`;
  return [`# Daimo Debug Log`, ...headerLines, log].join("\n\n");
}

/**
 * Returns a function to send a complete debug log + env summary.
 * Additionally returns the env summary for display.
 */
export function useSendDebugLog(
  account?: Account | null
): [() => Promise<void>, Record<string, string>] {
  if (account === undefined) {
    account = getAccountManager().currentAccount;
  }

  // Get security level of key storage.
  const [sec, setSec] = useState<Awaited<ReturnType<typeof getHardwareSec>>>();
  useEffect(() => {
    getHardwareSec().then(setSec);
  }, []);

  // Get phone and app info.
  const daimoChain = daimoChainFromId(account?.homeChainId || 84531);
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
