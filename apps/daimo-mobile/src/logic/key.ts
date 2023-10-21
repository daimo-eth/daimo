import { isDERPubKey, assert, parseAndNormalizeSig } from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { SigningCallback } from "@daimo/userop";
import { base64urlnopad } from "@scure/base";
import * as Crypto from "expo-crypto";
import {
  Hex,
  bytesToHex,
  concat,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
  isHex,
} from "viem";

import { Log } from "./log";

export function parseAddDeviceString(addString: string): Hex {
  const [prefix, pubKey] = addString.split(":");
  assert(prefix === "addkey");
  assert(isHex(pubKey));
  assert(isDERPubKey(pubKey));
  return pubKey;
}

export function createAddDeviceString(pubKey: Hex): string {
  assert(isDERPubKey(pubKey));
  return `addkey:${pubKey}`;
}

export function getWrappedRawSigner(
  enclaveKeyName: string,
  keySlot: number
): SigningCallback {
  return async (challengeHex: Hex) => {
    const bChallenge = hexToBytes(challengeHex);
    const challengeB64URL = base64urlnopad.encode(bChallenge);

    const clientDataJSON = JSON.stringify({
      type: "webauthn.get",
      challenge: challengeB64URL,
      origin: "daimo.xyz",
    });

    const clientDataHash = new Uint8Array(
      await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        new TextEncoder().encode(clientDataJSON)
      )
    );

    const authenticatorData = new Uint8Array(37); // rpIdHash (32) + flags (1) + counter (4)
    authenticatorData[32] = 5; // flags: user present (1) + user verified (4)
    const message = concat([authenticatorData, clientDataHash]);

    // Get P256-SHA256 signature, typically from a hardware enclave
    const derSig = await requestEnclaveSignature(
      enclaveKeyName,
      bytesToHex(message).slice(2),
      "Authorize transaction"
    );

    const { r, s } = parseAndNormalizeSig(`0x${derSig}`);

    const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'));
    const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'));

    const signatureStruct = getAbiItem({
      abi: daimoAccountABI,
      name: "signatureStruct",
    }).inputs;

    const encodedSig = encodeAbiParameters(signatureStruct, [
      {
        authenticatorData: bytesToHex(authenticatorData),
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

export async function requestEnclaveSignature(
  enclaveKeyName: string,
  hexMessage: string,
  usageMessage: string
): Promise<Hex> {
  const promptCopy: ExpoEnclave.PromptCopy = {
    usageMessage,
    androidTitle: "Daimo",
  };

  const signature = (await Log.promise(
    "ExpoEnclaveSign",
    ExpoEnclave.sign(enclaveKeyName, hexMessage, promptCopy)
  )) as Hex;

  return signature;
}
