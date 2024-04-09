import { p256 } from "@noble/curves/p256";
import assert from "node:assert";
import test from "node:test";
import { Hex, hexToBytes, numberToBytes, toHex } from "viem";

import { tryOrNull } from "../src/func";
import {
  derKeytoContractFriendlyKey,
  isDERPubKey,
  parseAndNormalizeSig,
} from "../src/key";
import {
  generateMnemonicKey,
  mnemonicToPublicKey,
  signWithMnemonic,
  validateMnemonic,
} from "../src/mnemonic/mnemonic";

function arrayBufToBase64UrlEncode(buf: Uint8Array) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\//g, "_").replace(/=/g, "").replace(/\+/g, "-");
}

async function p256Verify(signature: Hex, message: Hex, pubkey: Hex) {
  const [xHex, yHex] = derKeytoContractFriendlyKey(pubkey);

  const x = hexToBytes(xHex);
  const y = hexToBytes(yHex);

  const sigBigint = parseAndNormalizeSig(signature);
  const r = numberToBytes(sigBigint.r, { size: 32 });
  const s = numberToBytes(sigBigint.s, { size: 32 });

  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: arrayBufToBase64UrlEncode(x),
      y: arrayBufToBase64UrlEncode(y),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
  const sig = new Uint8Array([...r, ...s]);
  return await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    sig,
    Buffer.from(message.slice(2), "hex")
  );
}

test("mnemonic roundtrips", async () => {
  for (let i = 0; i < 10; i++) {
    const mnemonicKey = generateMnemonicKey();
    assert(validateMnemonic(mnemonicKey.mnemonic));

    const badMnemonic = // remove letters
      mnemonicKey.mnemonic.slice(
        0,
        Math.random() * mnemonicKey.mnemonic.length - 1
      );
    assert(!validateMnemonic(badMnemonic));

    const randomMessage = toHex(p256.utils.randomPrivateKey());
    const signature = await signWithMnemonic(
      mnemonicKey.mnemonic,
      randomMessage
    );

    const correct = await p256Verify(
      signature,
      randomMessage,
      mnemonicKey.publicKeyDER
    );

    assert(correct);

    const wrong = await p256Verify(
      signature,
      "0xdeadbeef",
      mnemonicKey.publicKeyDER
    );
    assert(!wrong);
  }
});

test("mnemonic produces valid signatures", async () => {
  // Load a P256 seed phrase
  const mnemonic =
    "hexagon wrap blood curious aspect exult selfish airport rewind gleeful alchemy humid";
  assert(validateMnemonic(mnemonic));

  const { publicKeyDER } = mnemonicToPublicKey(mnemonic);

  // Sign a test message
  const messageHex = "0xdeadbeef";
  const sigDerHex = await signWithMnemonic(mnemonic, messageHex);

  const result = await p256Verify(sigDerHex, messageHex, publicKeyDER);

  console.log(`SubtleCrypto signature verified: ${result}`);

  assert(result, "Invalid signature");
});

test("mnemonic produces a valid P256 DER pubkey", async () => {
  const mnemonicKey = generateMnemonicKey();
  assert(validateMnemonic(mnemonicKey.mnemonic));

  const { publicKeyDER } = mnemonicKey;

  assert(isDERPubKey(publicKeyDER));
});

test("invalid mnemonics fail", () => {
  const m1 = tryOrNull(() => mnemonicToPublicKey(""));
  assert(m1 == null);

  const m2 = tryOrNull(() => mnemonicToPublicKey("a a a a a a a a a a a a"));
  assert(m2 == null);

  const m3 = tryOrNull(() =>
    mnemonicToPublicKey(
      "aplomb purchase judge huge fatigue burden nitrogen navy swear utmost rebuild fringe"
    )
  );
  assert(m3 != null);
});
