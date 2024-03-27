import { base64 } from "@scure/base";
import { Platform } from "react-native";

import ExpoPasskeysModule from "./ExpoPasskeysModule";
import {
  CreateRequest,
  CreateResult,
  toAndroidCreateRequest,
  toBase64,
  SignRequest,
  SignResult,
  toAndroidSignRequest,
} from "./utils";

/**
 * Create a new passkey.
 * All parameters are either strings or in regular base64 encoding.
 *
 * @param request.domain The domain of the existing passkey.
 * @param request.challengeB64 The challenge to use for creation request.
 * @param request.passkeyName The name to attach the passkey to.
 * @param request.passkeyDisplayTitle The passkey name to display to user.
 * @return result.rawClientDataJSONB64 The raw client data JSON.
 * @return result.rawAttestationObjectB64 The raw attestation object.
 */
export async function createPasskey(
  request: CreateRequest
): Promise<CreateResult> {
  const userIDB64 = base64.encode(
    new TextEncoder().encode(request.passkeyName)
  );

  switch (Platform.OS) {
    case "ios": {
      const ret = await ExpoPasskeysModule.createPasskey(
        request.domain,
        request.passkeyDisplayTitle,
        userIDB64,
        request.challengeB64,
        request.useSecurityKey
      );
      return {
        rawClientDataJSONB64: ret.rawClientDataJSON,
        rawAttestationObjectB64: ret.rawAttestationObject,
      };
    }
    case "android": {
      if (request.useSecurityKey)
        throw new Error("Security keys not supported on Android");

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

/**
 * Sign using a passkey for a domain. The user is prompted to pick a passkey
 * if they have multiple passkeys for the domain.
 * All parameters are either strings or in regular base64 encoding.
 *
 * @param request.domain The domain to create the passkey for.
 * @param request.challengeB64 The challenge to request signature for.
 * @return result.passkeyName The account name corresponding to the passkey used.
 * @return result.rawClientDataJSONB64 The raw client data JSON.
 * @return result.rawAuthenticatorDataB64 The raw authenticator data.
 * @return result.signatureB64 The signature.
 */
export async function signWithPasskey(
  request: SignRequest
): Promise<SignResult> {
  switch (Platform.OS) {
    case "ios": {
      const ret = await ExpoPasskeysModule.signWithPasskey(
        request.domain,
        request.challengeB64,
        request.useSecurityKey
      );
      const userIDstr = new TextDecoder("utf-8").decode(
        base64.decode(ret.userID)
      );
      return {
        passkeyName: userIDstr,
        rawClientDataJSONB64: ret.rawClientDataJSON,
        rawAuthenticatorDataB64: ret.rawAuthenticatorData,
        signatureB64: ret.signature,
      };
    }
    case "android": {
      if (request.useSecurityKey)
        throw new Error("Security keys not supported on Android");

      const requestJSON = toAndroidSignRequest(request);
      const ret = JSON.parse(
        await ExpoPasskeysModule.signWithPasskey(requestJSON)
      );
      const userIDstr = new TextDecoder("utf-8").decode(
        base64.decode(toBase64(ret.response.userHandle))
      );
      return {
        passkeyName: userIDstr,
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
