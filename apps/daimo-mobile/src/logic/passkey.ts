import { Buffer } from "@craftzdog/react-native-buffer";
import { contractFriendlyKeyToDER, parseAndNormalizeSig } from "@daimo/common";
import * as ExpoPasskeys from "@daimo/expo-passkeys";
import { base64 } from "@scure/base";
import { Hex, bytesToHex, numberToBytes } from "viem";

require("cbor-rn-prereqs"); // Make CBOR work in React Native
const cbor = require("cbor");

export function parseMakeCredAuthData(buffer: Uint8Array) {
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

export function COSEECDHAtoRaw(COSEPublicKey: Uint8Array): Hex {
  const coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
  const x = coseStruct.get(-2);
  const y = coseStruct.get(-3);

  return contractFriendlyKeyToDER([
    `0x${Buffer.from(x).toString("hex")}`,
    `0x${Buffer.from(y).toString("hex")}`,
  ]);
}

export function parseCreateResponse(result: ExpoPasskeys.CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64);
  const attestationObject = cbor.decode(rawAttestationObject);
  const authData = parseMakeCredAuthData(attestationObject.authData);
  const pubKey = COSEECDHAtoRaw(authData.COSEPublicKey);
  return pubKey;
}

export function parseSignResponse(result: ExpoPasskeys.SignResult) {
  const derSig = base64.decode(result.signatureB64);

  const { r, s } = parseAndNormalizeSig(bytesToHex(derSig));

  const bR = numberToBytes(r, { size: 32 });
  const bLowS = numberToBytes(s, { size: 32 });

  const rawAuthenticatorData = Buffer.from(
    base64.decode(result.rawAuthenticatorDataB64)
  ).toString("hex");

  const clientDataJSON = Buffer.from(
    base64.decode(result.rawClientDataJSONB64)
  ).toString("utf-8");

  const challengeLocation = clientDataJSON.indexOf('"challenge":"');
  const responseTypeLocation = clientDataJSON.indexOf('"type":"');

  return {
    signature: [
      Buffer.from(bR).toString("hex"),
      Buffer.from(bLowS).toString("hex"),
    ] as [Hex, Hex],
    rawAuthenticatorData,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
  };
}

export async function createPasskey(accountName: string) {
  const challengeB64 = btoa(`create key ${accountName}`);

  const result = await ExpoPasskeys.createPasskey({
    domain: "daimo.xyz",
    accountName,
    challengeB64,
  });

  return parseCreateResponse(result);
}

// TODO WIP
// export function getWrappedPasskeySigner(): SigningCallback {
//   return async (challengeHex: Hex) => {
//     const bChallenge = hexToBytes(challengeHex);
//     const challengeB64URL = base64urlnopad.encode(bChallenge);

//     const clientDataJSON = JSON.stringify({
//       type: "webauthn.get",
//       challenge: challengeB64URL,
//       origin: "https://daimo.xyz",
//     });

//     const clientDataHash = new Uint8Array(
//       await Crypto.digest(
//         Crypto.CryptoDigestAlgorithm.SHA256,
//         new TextEncoder().encode(clientDataJSON)
//       )
//     );

//     const authenticatorData = new Uint8Array(37); // rpIdHash (32) + flags (1) + counter (4)
//     authenticatorData[32] = 5; // flags: user present (1) + user verified (4)
//     const message = concat([authenticatorData, clientDataHash]);

//     // Get P256-SHA256 signature, typically from a hardware enclave
//     const derSig = await requestEnclaveSignature(
//       enclaveKeyName,
//       bytesToHex(message).slice(2),
//       "Authorize transaction"
//     );

//     // Parse signature TODO
//     const parsedSignature = p256.Signature.fromDER(derSig);
//     const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`);
//     assert(bSig.length === 64, "signature is not 64 bytes");
//     const bR = bSig.slice(0, 32);
//     const bS = bSig.slice(32);

//     // Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
//     const r = bytesToBigInt(bR);
//     let s = bytesToBigInt(bS);
//     const n = BigInt(
//       "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
//     );
//     if (s > n / 2n) {
//       s = n - s;
//     }

//     const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'));
//     const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'));

//     const signatureStruct = getAbiItem({
//       abi: daimoAccountABI,
//       name: "signatureStruct",
//     }).inputs;

//     const encodedSig = encodeAbiParameters(signatureStruct, [
//       {
//         authenticatorData: bytesToHex(authenticatorData),
//         clientDataJSON,
//         challengeLocation,
//         responseTypeLocation,
//         r,
//         s,
//       },
//     ]);

//     return {
//       keySlot,
//       encodedSig,
//     };
//   };
// }
