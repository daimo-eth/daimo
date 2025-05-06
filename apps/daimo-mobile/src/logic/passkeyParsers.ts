import { Buffer } from "@craftzdog/react-native-buffer";
import { contractFriendlyKeyToDER } from "@daimo/common";
import { CreateResult, SignResult } from "@daimo/expo-passkeys";
import { base64 } from "@scure/base";
import { Hex, bytesToHex } from "viem";

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
export function parseCreateResponse(result: CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64);
  const attestationObject = cbor.decode(rawAttestationObject);
  const authData = parseMakeCredAuthData(attestationObject.authData);
  const pubKey = COSEECDHAtoDER(authData.COSEPublicKey);
  return pubKey;
}

// Parses Webauthn GetAssertion response
// https://www.w3.org/TR/webauthn-2/#sctn-op-get-assertion
export function parseSignResponse(result: SignResult) {
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
