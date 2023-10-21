import { Buffer } from "@craftzdog/react-native-buffer";
import { contractFriendlyKeyToDER, parseAndNormalizeSig } from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
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

require("cbor-rn-prereqs"); // Make CBOR work in React Native
const cbor = require("cbor");

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

function COSEECDHAtoRaw(COSEPublicKey: Uint8Array): Hex {
  const coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
  const x = coseStruct.get(-2);
  const y = coseStruct.get(-3);

  return contractFriendlyKeyToDER([
    `0x${Buffer.from(x).toString("hex")}`,
    `0x${Buffer.from(y).toString("hex")}`,
  ]);
}

function parseCreateResponse(result: ExpoPasskeys.CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64);
  const attestationObject = cbor.decode(rawAttestationObject);
  const authData = parseMakeCredAuthData(attestationObject.authData);
  const pubKey = COSEECDHAtoRaw(authData.COSEPublicKey);
  return pubKey;
}

function parseSignResponse(result: ExpoPasskeys.SignResult) {
  const derSig = base64.decode(result.signatureB64);
  const rawAuthenticatorData = base64.decode(result.rawAuthenticatorDataB64);
  const accountName = result.accountName;
  const keySlot = result.keyID;

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

export async function createPasskey(accountName: string, keySlot: number) {
  const challengeB64 = btoa(`create key ${accountName}`);

  const result = await Log.promise(
    "ExpoPasskeysCreate",
    ExpoPasskeys.createPasskey({
      domain: "daimo.xyz",
      accountName,
      keyID: keySlot,
      challengeB64,
    })
  );

  return parseCreateResponse(result);
}

export function getWrappedPasskeySigner(): SigningCallback {
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
    } = await requestPasskeySignature(challengeB64, "daimo.xyz");
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
