import { getSlotLabel, parseAndNormalizeSig } from "@daimo/common";
import { DaimoChain, daimoAccountABI } from "@daimo/contract";
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

import { env } from "./env";
import { Log } from "./log";
import { parseCreateResponse, parseSignResponse } from "./passkeyParsers";

function matchAASABugError(e: string) {
  // Match without english text since iOS errors are localized to device language
  return e.includes("JV8PYC9QV4.com.daimo") && e.includes("daimo.com");
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
    matchAASABugError
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
    matchAASABugError
  );
  console.log("[PASSKEY] Got signature result from expo module", result);

  return parseSignResponse(result);
}
