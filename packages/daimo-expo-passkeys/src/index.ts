// Import the native module. On web, it will be resolved to ExpoPasskeys.web.ts
// and on native platforms to ExpoPasskeys.ts
import { decode as atob, encode as btoa } from "base-64";
import { Platform } from "react-native";

import ExpoPasskeysModule from "./ExpoPasskeysModule";

export type CreateRequest = {
  domain: string;
  challengeB64: string;
  accountName: string;
};

export type CreateResult = {
  rawClientDataJSONB64: string;
  rawAttestationObjectB64: string;
};

function toBase64URL(valueBase64: string): string {
  return valueBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toBase64(valueBase64URL: string): string {
  const m = valueBase64URL.length % 4;
  return valueBase64URL
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(valueBase64URL.length + (m === 0 ? 0 : 4 - m), "=");
}

function toAndroidCreateRequest(
  request: CreateRequest,
  userIDB64: string
): string {
  const requestObj = {
    rp: {
      id: request.domain,
      name: request.domain,
    },
    user: {
      id: toBase64URL(userIDB64),
      name: request.accountName,
      displayName: request.accountName,
    },
    challenge: toBase64URL(request.challengeB64),
    pubKeyCredParams: [
      {
        type: "public-key",
        alg: -7, // "ES256" as registered in the IANA COSE Algorithms registry
      },
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      requireResidentKey: true,
      residentKey: "required",
      userVerification: "required",
    },
  };

  return JSON.stringify(requestObj);
}

export async function createPasskey(
  request: CreateRequest
): Promise<CreateResult> {
  const userIDB64 = btoa(request.accountName);

  switch (Platform.OS) {
    case "ios": {
      const ret = await ExpoPasskeysModule.createPasskey(
        request.domain,
        request.accountName,
        userIDB64,
        request.challengeB64
      );
      return {
        rawClientDataJSONB64: ret.rawClientDataJSON,
        rawAttestationObjectB64: ret.rawAttestationObject,
      };
    }
    case "android": {
      const requestJSON = toAndroidCreateRequest(request, userIDB64);
      const ret = JSON.parse(
        await ExpoPasskeysModule.createPasskey(requestJSON)
      );
      return {
        rawClientDataJSONB64: toBase64(ret.response.clientDataJSON),
        rawAttestationObjectB64: toBase64(ret.response.attestationObject),
      };
    }
    default: {
      throw new Error("Unsupported platform");
    }
  }
}

export type SignRequest = {
  domain: string;
  challengeB64: string;
};

export type SignResult = {
  accountName: string;
  rawClientDataJSONB64: string;
  rawAuthenticatorDataB64: string;
  signatureB64: string;
};

function toAndroidSignRequest(request: SignRequest): string {
  const requestObj = {
    rpId: request.domain,
    challenge: toBase64URL(request.challengeB64),
  };

  return JSON.stringify(requestObj);
}

export async function signWithPasskey(
  request: SignRequest
): Promise<SignResult> {
  switch (Platform.OS) {
    case "ios": {
      const ret = await ExpoPasskeysModule.signWithPasskey(
        request.domain,
        request.challengeB64
      );
      return {
        accountName: atob(ret.userID),
        rawClientDataJSONB64: ret.rawClientDataJSON,
        rawAuthenticatorDataB64: ret.rawAuthenticatorData,
        signatureB64: ret.signature,
      };
    }
    case "android": {
      const requestJSON = toAndroidSignRequest(request);
      const ret = JSON.parse(
        await ExpoPasskeysModule.signWithPasskey(requestJSON)
      );
      return {
        accountName: atob(toBase64(ret.response.userHandle)),
        rawClientDataJSONB64: toBase64(ret.response.clientDataJSON),
        rawAuthenticatorDataB64: toBase64(ret.response.authenticatorData),
        signatureB64: toBase64(ret.response.signature),
      };
    }
    default: {
      throw new Error("Unsupported platform");
    }
  }
}
