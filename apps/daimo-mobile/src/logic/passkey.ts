import { Buffer } from "@craftzdog/react-native-buffer";
import { contractFriendlyKeyToDER, parseAndNormalizeSig } from "@daimo/common";
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

require("cbor-rn-prereqs"); // Make CBOR work in React Native
const cbor = require("cbor");

// Parses authenticatorData buffer to struct
// https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
function parseMakeCredAuthData(buffer: Uint8Array) {
  const rpIdHash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  const flagsBuf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  const flags = flagsBuf[0];
  const counterBuf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  const counter = Buffer.from(counterBuf).readUInt32BE(0);
  // const counter = counterBuf.
  const aaguid = buffer.slice(0, 16);
  buffer = buffer.slice(16);
  const credIDLenBuf = buffer.slice(0, 2);
  buffer = buffer.slice(2);
  const credIDLen = Buffer.from(credIDLenBuf).readUInt16BE(0);
  const credID = buffer.slice(0, credIDLen);
  buffer = buffer.slice(credIDLen);
  const COSEPublicKey = buffer;

  return {
    rpIdHash,
    flagsBuf,
    flags,
    counter,
    counterBuf,
    aaguid,
    credID,
    COSEPublicKey,
  };
}

// Takes COSE encoded public key and converts it to DER keys
// https://www.rfc-editor.org/rfc/rfc8152.html#section-13.1
function COSEECDHAtoDER(COSEPublicKey: Uint8Array): Hex {
  const coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
  const x = coseStruct.get(-2);
  const y = coseStruct.get(-3);

  return contractFriendlyKeyToDER([
    `0x${Buffer.from(x).toString("hex")}`,
    `0x${Buffer.from(y).toString("hex")}`,
  ]);
}

// Parses Webauthn MakeCredential response
// https://www.w3.org/TR/webauthn-2/#sctn-op-make-cred
function parseCreateResponse(result: ExpoPasskeys.CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64);
  const attestationObject = cbor.decode(rawAttestationObject);
  const authData = parseMakeCredAuthData(attestationObject.authData);
  const pubKey = COSEECDHAtoDER(authData.COSEPublicKey);
  return pubKey;
}

// Parses Webauthn GetAssertion response
// https://www.w3.org/TR/webauthn-2/#sctn-op-get-assertion
function parseSignResponse(result: ExpoPasskeys.SignResult) {
  const derSig = base64.decode(result.signatureB64);
  const rawAuthenticatorData = base64.decode(result.rawAuthenticatorDataB64);
  const passkeyName = result.passkeyName;
  const [accountName, keySlotStr] = passkeyName.split("."); // Assumes account name does not have periods (.) in it.
  const keySlot = parseInt(keySlotStr, 10);

  const clientDataJSON = Buffer.from(
    base64.decode(result.rawClientDataJSONB64)
  ).toString("utf-8");

  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":"'));
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":"'));

  return {
    derSig: bytesToHex(derSig),
    rawAuthenticatorData,
    accountName,
    keySlot,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
  };
}

// Wrapper for Expo module native passkey creation
export async function createPasskey(
  daimoChain: DaimoChain,
  accountName: string,
  keySlot: number
) {
  console.log(
    "[Passkey] Creating passkey",
    accountName,
    keySlot,
    env(daimoChain).passkeyDomain
  );
  const passkeyName = `${accountName}.${keySlot}`;
  const passkeyDisplayTitle = accountName; // Don't show metadata to the user
  const challengeB64 = btoa(`create key ${accountName} ${keySlot}`);

  const result = await Log.promise(
    "ExpoPasskeysCreate",
    ExpoPasskeys.createPasskey({
      domain: env(daimoChain).passkeyDomain,
      passkeyName,
      passkeyDisplayTitle,
      challengeB64,
    })
  );

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
    console.log("[Passkey] Got signature", derSig, accountName, keySlot);

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
  const result = await Log.promise(
    "ExpoPasskeysSign",
    ExpoPasskeys.signWithPasskey({
      domain,
      challengeB64,
    })
  );

  return parseSignResponse(result);
}
