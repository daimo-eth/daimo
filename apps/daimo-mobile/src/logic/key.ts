import {
  isDERPubKey,
  assert,
  parseAndNormalizeSig,
  SlotType,
  signWithMnemonic,
} from "@daimo/common";
import { daimoAccountABI, daimoAccountV2ABI } from "@daimo/contract";
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

// Wrapped raw signers to sign messages in the same format as WebAuthn.
// This makes verification easier on-chain.
function wrapRawSignerAsWebauthn(
  sign: (message: Hex) => Promise<Hex>,
  keySlot: number,
  accountVersion: "v1" | "v2"
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

    // Get P256-SHA256 signature, using passed (raw) sign function.
    const hexDerSig = await sign(bytesToHex(message));

    const { r, s } = parseAndNormalizeSig(hexDerSig);

    const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'));
    const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'));

    let encodedSig: Hex;

    if (accountVersion === "v1") {
      const signatureStruct = getAbiItem({
        abi: daimoAccountABI,
        name: "signatureStruct",
      }).inputs;
      const sigFields = {
        authenticatorData: bytesToHex(authenticatorData),
        clientDataJSON,
        challengeLocation,
        responseTypeLocation,
        r,
        s,
      };
      encodedSig = encodeAbiParameters(signatureStruct, [sigFields]);
    } else {
      assert(accountVersion === "v2");
      const signatureStruct = getAbiItem({
        abi: daimoAccountV2ABI,
        name: "signatureStruct",
      }).inputs;
      const sigFields = {
        keySlot,
        authenticatorData: bytesToHex(authenticatorData),
        clientDataJSON,
        r,
        s,
      };
      encodedSig = encodeAbiParameters(signatureStruct, [sigFields]);
    }

    return {
      keySlot,
      encodedSig,
    };
  };
}

export function getWrappedDeviceKeySigner(
  enclaveKeyName: string,
  keySlot: number,
  accountVersion: "v1" | "v2"
): SigningCallback {
  return wrapRawSignerAsWebauthn(
    (message) =>
      requestEnclaveSignature(
        enclaveKeyName,
        message.slice(2),
        "Authorize transaction"
      ),
    keySlot,
    accountVersion
  );
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

  // Signature is raw hex DER, no 0x prefix
  const signature = await Log.promise(
    "ExpoEnclaveSign",
    ExpoEnclave.sign(enclaveKeyName, hexMessage, promptCopy)
  );

  return `0x${signature}`;
}

export function getWrappedMnemonicSigner(
  mnemonic: string,
  keySlot: number,
  accountVersion: "v1" | "v2"
): SigningCallback {
  return wrapRawSignerAsWebauthn(
    (message) => signWithMnemonic(mnemonic, message),
    keySlot,
    accountVersion
  );
}
