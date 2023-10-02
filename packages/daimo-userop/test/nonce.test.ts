import assert from "node:assert";
import test from "node:test";
import { Hex } from "viem";

import { DaimoNonce, DaimoNonceMetadata, DaimoNonceType } from "../src/nonce";

const testNonceTypes = [
  DaimoNonceType.Send,
  DaimoNonceType.CreateNote,
  DaimoNonceType.ClaimNote,
  DaimoNonceType.RequestResponse,
];

const testNonceIdentifiers = ["123", "0", "1", "12345678901234567"];
const testPassedKeys = [
  "0x00000000000000000000000000000001",
  "0x00000000000000000000000000000000",
  "0x12345678901234567890123456789012",
];

test("DaimoNonceMetadata serde", () => {
  for (const nonceType of testNonceTypes) {
    for (const identifier of testNonceIdentifiers) {
      const metadata = new DaimoNonceMetadata(nonceType, BigInt(identifier));
      const hex = metadata.toHex();
      assert.strictEqual(hex.length, 2 + 16);
      const parsed = DaimoNonceMetadata.fromHex(hex);
      assert.deepStrictEqual(parsed, metadata);
    }
  }
});

test("DaimoNonce serde", () => {
  for (const nonceType of testNonceTypes) {
    for (const identifier of testNonceIdentifiers) {
      for (const passedKey of testPassedKeys) {
        const metadata = new DaimoNonceMetadata(nonceType, BigInt(identifier));
        const nonce = new DaimoNonce(metadata, passedKey as Hex);
        const hex = nonce.toHex();
        assert.strictEqual(hex.length, 2 + 64);
        const parsed = DaimoNonce.fromHex(hex);
        assert.deepStrictEqual(parsed, nonce);
      }
    }
  }
});

test("DaimoNonce bad Nonce type serialization", () => {
  const hexNonceBadType =
    "0xFE00000000000123123412341234123412341234123412340000000000000000"; // Nonce type = 254
  let parsed = DaimoNonce.fromHex(hexNonceBadType);
  assert.strictEqual(parsed, undefined);

  const hexNonceMaxType =
    "0xFF00000000000123123412341234123412341234123412340000000000000000"; // Nonce type = 255
  parsed = DaimoNonce.fromHex(hexNonceMaxType);
  assert.strictEqual(parsed, undefined);
});
