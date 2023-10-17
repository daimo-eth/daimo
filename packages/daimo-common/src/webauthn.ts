import * as ExpoPasskeys from "@daimo/expo-passkeys";
import { p256 } from "@noble/curves/p256";
import { base64 } from "@scure/base";
import * as cbor from "cbor";
import { Hex, bytesToBigint, hexToBytes, numberToBytes } from "viem";

import { assert } from "./assert";

export function parseMakeCredAuthData(buffer: Uint8Array) {
  const rpIdHash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  const flagsBuf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  const flags = flagsBuf[0];
  const counterBuf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  const counter = Buffer.from(counterBuf).readUInt32BE(0);
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

export function COSEECDHAtoRaw(COSEPublicKey: Uint8Array): [Hex, Hex] {
  const coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
  const x = coseStruct.get(-2);
  const y = coseStruct.get(-3);

  return [Buffer.from(x).toString("hex"), Buffer.from(y).toString("hex")] as [
    Hex,
    Hex
  ];
}

export function parseCreateResponse(result: ExpoPasskeys.CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64);
  const attestationObject = cbor.decode(rawAttestationObject);
  const authData = parseMakeCredAuthData(attestationObject.authData);
  const pubKey = COSEECDHAtoRaw(authData.COSEPublicKey);
  return { pubKey };
}

export function parseSignResponse(result: ExpoPasskeys.SignResult) {
  const derSig = base64.decode(result.signatureB64);
  const parsedSignature = p256.Signature.fromDER(derSig);
  const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`);
  assert(bSig.length === 64, "signature is not 64 bytes");
  const bR = bSig.slice(0, 32);
  const bS = bSig.slice(32);

  // Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
  let s = bytesToBigint(bS);
  const n = BigInt(
    "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
  );
  if (s > n / 2n) {
    s = n - s;
  }
  const bLowS = numberToBytes(s, { size: 32 });

  const rawAuthenticatorData = Buffer.from(
    base64.decode(result.rawAuthenticatorDataB64)
  ).toString("hex");

  const clientDataJSON = Buffer.from(
    base64.decode(result.rawClientDataJSONB64)
  ).toString("utf-8");

  const challengeLocation = clientDataJSON.indexOf('"challenge":"');

  return {
    signature: [
      Buffer.from(bR).toString("hex"),
      Buffer.from(bLowS).toString("hex"),
    ] as [Hex, Hex],
    rawAuthenticatorData,
    clientDataJSON,
    challengeLocation,
  };
}
