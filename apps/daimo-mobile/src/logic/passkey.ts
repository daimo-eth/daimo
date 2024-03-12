import { getSlotLabel, parseAndNormalizeSig } from "@daimo/common";
import { DaimoChain, daimoAccountABI } from "@daimo/contract";
import * as ExpoPasskeys from "@daimo/expo-passkeys";
import { SigningCallback } from "@daimo/userop";
import { base64 } from "@scure/base";
import { Platform } from "react-native";
import {
  Hex,
  bytesToHex,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
} from "viem";

import { env } from "./env";
import { Log } from "./log";
import { parseCreateResponse, parseSignResponse } from "./passkeyParsers";

// Workaround for iOS bug with passkeys: prefetch AASA
export async function prefetchAASA() {
  if (Platform.OS !== "ios" && Platform.OS !== "macos") return;

  const result = await fetch(
    "https://app-site-association.cdn-apple.com/a/v1/daimo.com" // Apple CDN URL
  );

  if (!result.ok) {
    console.log("[PASSKEY] Failed to prefetch AASA", result);
  }
}

function matchAASAError(e: any) {
  return (
    e.message.includes("JV8PYC9QV4.com.daimo") &&
    e.message.includes("daimo.com")
  );
}

// Wrapper for Expo module native passkey creation
export async function createPasskey(
  daimoChain: DaimoChain,
  accountName: string,
  keySlot: number
) {
  console.log(
    "[PASSKEY] Creating passkey",
    accountName,
    keySlot,
    env(daimoChain).passkeyDomain
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
      }),
    3,
    matchAASAError
  );

  console.log("[PASSKEY] Got creation result from expo module", result);

  return parseCreateResponse(result);
}

// @daimo/userop compatible Signer for Webauthn signatures
export function getWrappedPasskeySigner(
  daimoChain: DaimoChain
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
      env(daimoChain).passkeyDomain
    );
    console.log("[PASSKEY] Got signature", derSig, accountName, keySlot);

    const { r, s } = parseAndNormalizeSig(derSig);

    const signatureStruct = getAbiItem({
      abi: daimoAccountABI,
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

export async function requestPasskeySignature(
  challengeB64: string,
  domain: string
) {
  const result = await Log.retryBackoff(
    "ExpoPasskeysSign",
    () =>
      ExpoPasskeys.signWithPasskey({
        domain,
        challengeB64,
      }),
    3,
    matchAASAError
  );
  console.log("[PASSKEY] Got signature result from expo module", result);

  return parseSignResponse(result);
}
