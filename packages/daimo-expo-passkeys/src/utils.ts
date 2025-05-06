export type CreateRequest = {
  domain: string;
  challengeB64: string;
  passkeyName: string;
  passkeyDisplayTitle: string;
  useSecurityKey: boolean;
};

export type CreateResult = {
  rawClientDataJSONB64: string;
  rawAttestationObjectB64: string;
};

export type SignRequest = {
  domain: string;
  challengeB64: string;
  useSecurityKey: boolean;
};

export type SignResult = {
  passkeyName: string;
  rawClientDataJSONB64: string;
  rawAuthenticatorDataB64: string;
  signatureB64: string;
};

export function toBase64URL(valueBase64: string): string {
  return valueBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function toBase64(valueBase64URL: string): string {
  const m = valueBase64URL.length % 4;
  return valueBase64URL
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(valueBase64URL.length + (m === 0 ? 0 : 4 - m), "=");
}

export function toAndroidCreateRequest(
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
      name: request.passkeyDisplayTitle,
      displayName: request.passkeyDisplayTitle,
    },
    challenge: toBase64URL(request.challengeB64),
    pubKeyCredParams: [
      {
        type: "public-key",
        alg: -7, // "ES256" as registered in the IANA COSE Algorithms registry
      },
    ],
    authenticatorSelection: {
      requireResidentKey: true,
      residentKey: "required",
    },
  };

  return JSON.stringify(requestObj);
}

export function toAndroidSignRequest(request: SignRequest): string {
  const requestObj = {
    rpId: request.domain,
    challenge: toBase64URL(request.challengeB64),
  };

  return JSON.stringify(requestObj);
}
