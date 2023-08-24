import assert from "node:assert";
import test from "node:test";
import { Hex } from "viem";

import {
  contractFriendlyKeyToDER,
  derKeytoContractFriendlyKey,
  isDERPubKey,
} from "../src/key";

const testCases: [Hex, [Hex, Hex]][] = [
  // Same as Swift playground and Solidity tests
  [
    "0x3059301306072a8648ce3d020106082a8648ce3d0301070342000465a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e44a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437",
    [
      "0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4",
      "0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437",
    ],
  ],
  [
    "0x3059301306072a8648ce3d020106082a8648ce3d030107034200041bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421daa54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43",
    [
      "0x1bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421da",
      "0xa54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43",
    ],
  ],
];

test("checker der format correctly", () => {
  for (const [der, raw] of testCases) {
    assert(isDERPubKey(der));
    assert(!isDERPubKey(raw[0]));
    assert(!isDERPubKey(raw[1]));
    assert(!isDERPubKey((raw[0] + raw[1]) as Hex));
    assert(!isDERPubKey((raw[0] + raw[1].slice(2)) as Hex));
  }
});

test("converts from der to raw", () => {
  for (const [der, raw] of testCases) {
    assert.deepStrictEqual(derKeytoContractFriendlyKey(der), raw);
  }
});

test("converts from raw to der", () => {
  for (const [der, raw] of testCases) {
    assert.deepStrictEqual(contractFriendlyKeyToDER(raw), der);
  }
});
