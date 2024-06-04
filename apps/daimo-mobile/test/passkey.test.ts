import { contractFriendlyKeyToDER, parseAndNormalizeSig } from "@daimo/common";
import { Hex } from "viem";

import {
  parseCreateResponse,
  parseSignResponse,
} from "../src/logic/passkeyParsers";

const createResult = {
  rawAttestationObjectB64:
    "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYizwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsRdAAAAAAAAAAAAAAAAAAAAAAAAAAAAFI6/XGQDoO+69ZA1ZDSqXMU1A8q2pQECAyYgASFYILbo5B0aQxUxtm2tq4VU9VILS61c4ZSqXLXFEBdgbo61Ilgg4Lme/b/dEoIbWLn85MlpREPQLp82agWlpoaOLVgTgsQ=",
  rawClientDataJSONB64:
    "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxJR3RsZVNCMFpYTjBNek1nTVRJNCIsIm9yaWdpbiI6Imh0dHBzOi8vZGFpbW8ueHl6In0=",
};

const signResult = {
  passkeyName: "test33.128",
  rawAuthenticatorDataB64:
    "izwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsQdAAAAAA==",
  rawClientDataJSONB64:
    "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiM3EwIiwib3JpZ2luIjoiaHR0cHM6Ly9kYWltby54eXoifQ==",
  signatureB64:
    "MEQCID7Flt3axeMxi1ZqPcRVfWB7PTlEr7ATkiCzWe5G080wAiB5/xo5R/SuGDdjbUN4Uaw0hNg4d/f86Hbk/9sVH+n9rQ==",
};

describe("Passkey", () => {
  it("Parses create response", () => {
    const derKey = parseCreateResponse(createResult);
    const expectedContractKey = [
      "0xb6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5",
      "0xe0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4",
    ] as [Hex, Hex];
    expect(derKey).toEqual(contractFriendlyKeyToDER(expectedContractKey));
  });

  it("Parses sign response", () => {
    const parsedSignResponse = parseSignResponse(signResult);
    expect(parsedSignResponse.accountName).toEqual("test33");
    expect(parsedSignResponse.keySlot).toEqual(128);
    const { r, s } = parseAndNormalizeSig(parsedSignResponse.derSig);
    expect(r).toEqual(
      BigInt(
        "0x3ec596dddac5e3318b566a3dc4557d607b3d3944afb0139220b359ee46d3cd30"
      )
    );
    expect(s).toEqual(
      BigInt(
        "0x79ff1a3947f4ae1837636d437851ac3484d83877f7fce876e4ffdb151fe9fdad"
      )
    );
    expect(JSON.parse(parsedSignResponse.clientDataJSON)).toEqual({
      type: "webauthn.get",
      challenge: "3q0",
      origin: "https://daimo.xyz",
    });
    expect(parsedSignResponse.responseTypeLocation).toEqual(1n);
    expect(parsedSignResponse.challengeLocation).toEqual(23n);
  });
});
