import {
  isDERPubKey,
  assert,
  parseAndNormalizeSig,
  SlotType,
} from "@daimo/common";
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

// Parses the custom URI from the Add Device QR code.
export function parseAddDeviceString(addString: string): [Hex, SlotType] {
  const prefix = addString.split(":")[0];

  if (prefix === "addkey") {
    // Backcompat with old version of the app
    const pubKey = addString.split(":")[1];
    assert(isHex(pubKey));
    assert(isDERPubKey(pubKey));
    return [pubKey, SlotType.Phone];
  }

  assert(prefix === "addkeyV2");
  const [pubKey, slot] = addString.split(":").slice(1);
  assert(isHex(pubKey));
  assert(isDERPubKey(pubKey));
  assert(slot in SlotType);
  return [pubKey, slot as SlotType];
}

// Creates a custom URI for the Add Device QR code.
export function createAddDeviceString(pubKey: Hex, slot: SlotType): string {
  assert(isDERPubKey(pubKey));
  return `addkeyV2:${pubKey}:${slot}`;
}

// Creates minimal Webauthn signatures using a hardware enclave key.
// Unlike passkeys, which are backed up, enclave keys never leave the device.
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

async function requestEnclaveSignature(
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
