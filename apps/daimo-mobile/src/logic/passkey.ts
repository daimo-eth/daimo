import {
  SlotType,
  getSlotLabel,
  getSlotType,
  parseAndNormalizeSig,
} from "@daimo/common";
import { DaimoChain, daimoAccountAbi } from "@daimo/contract";
import * as ExpoPasskeys from "@daimo/expo-passkeys";
import { SigningCallback } from "@daimo/userop";
import { base64 } from "@scure/base";
import {
  Hex,
  bytesToHex,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
} from "viem";

import { Log } from "./log";
import { parseCreateResponse, parseSignResponse } from "./passkeyParsers";
import { env } from "../env";

// Workaround iOS Passkeys AASA bug: https://github.com/daimo-eth/daimo/issues/837
function matchAASABugError(e: string) {
  // Match without english text since iOS errors are localized to device language
  return e.includes("JV8PYC9QV4.com.daimo") && e.includes("daimo.com");
}

const AASA_BUG_MESSAGE = "iOS system error. Restart the app, then try again.";

// Wrapper for Expo module native passkey creation
export async function createPasskey(
  daimoChain: DaimoChain,
  accountName: string,
  keySlot: number
) {
  const useSecurityKey = getSlotType(keySlot) === SlotType.SecurityKeyBackup;
  console.log(
    "[PASSKEY] Creating passkey",
    accountName,
    keySlot,
    env(daimoChain).passkeyDomain,
    useSecurityKey
  );
  const passkeyName = `${accountName}.${keySlot}`;

  // Display title shows lowercase slot name, eg "alice passkey backup"
  const slotLabel = getSlotLabel(keySlot).toLowerCase();
  const passkeyDisplayTitle = `${accountName} ${slotLabel}`;

  const challengeB64 = btoa(`create key ${accountName} ${keySlot}`);

  const result = await Log.retryBackoff(
    "ExpoPasskeysCreate",
    () =>
      ExpoPasskeys.createPasskey({
        domain: env(daimoChain).passkeyDomain,
        passkeyName,
        passkeyDisplayTitle,
        challengeB64,
        useSecurityKey,
      }),
    5,
    matchAASABugError,
    AASA_BUG_MESSAGE
  );

  console.log("[PASSKEY] Got creation result from expo module", result);

  return parseCreateResponse(result);
}

// @daimo/userop compatible Signer for Webauthn signatures
export function getWrappedPasskeySigner(
  daimoChain: DaimoChain,
  useSecurityKey: boolean
): SigningCallback {
  return async (challengeHex: Hex) => {
    const bChallenge = hexToBytes(challengeHex);
    const challengeB64 = base64.encode(bChallenge);

    // Get Challenge assertion
    const {
      derSig,
      accountName,
      keySlot,
      rawAuthenticatorData,
      clientDataJSON,
      challengeLocation,
      responseTypeLocation,
    } = await requestPasskeySignature(
      challengeB64,
      env(daimoChain).passkeyDomain,
      useSecurityKey
    );
    console.log("[PASSKEY] Got signature", derSig, accountName, keySlot);

    const { r, s } = parseAndNormalizeSig(derSig);

    const signatureStruct = getAbiItem({
      abi: daimoAccountAbi,
      name: "signatureStruct",
    }).inputs;

    const encodedSig = encodeAbiParameters(signatureStruct, [
      {
        authenticatorData: bytesToHex(rawAuthenticatorData),
        clientDataJSON,
        challengeLocation,
        responseTypeLocation,
        r,
        s,
      },
    ]);

    return {
      keySlot,
      encodedSig,
    };
  };
}

async function requestPasskeySignature(
  challengeB64: string,
  domain: string,
  useSecurityKey: boolean
) {
  const result = await Log.retryBackoff(
    "ExpoPasskeysSign",
    () =>
      ExpoPasskeys.signWithPasskey({
        domain,
        challengeB64,
        useSecurityKey,
      }),
    5,
    matchAASABugError,
    AASA_BUG_MESSAGE
  );
  console.log("[PASSKEY] Got signature result from expo module", result);

  return parseSignResponse(result);
}
