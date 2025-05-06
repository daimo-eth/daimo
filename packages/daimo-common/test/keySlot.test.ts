import assert from "node:assert";
import test from "node:test";

import { SlotType, findUnusedSlot, getSlotLabel } from "../src/keySlot";

const testCases: [number, string][] = [
  [0, "Phone"],
  [25, "Phone 26"],
  [26, "Phone 27"],
  [129, "Passkey Backup 2"],
  [65, "Computer 2"],
  [160, "Security Key Backup"],
  [193, "Seed Phrase Backup 2"],
];

test("describes identifiers correctly", () => {
  for (const [keyData, expected] of testCases) {
    assert.deepStrictEqual(getSlotLabel(keyData), expected);
  }
});

test("finds unused slot", () => {
  assert.deepStrictEqual(findUnusedSlot([], SlotType.Phone), 0);
  assert.deepStrictEqual(findUnusedSlot([0], SlotType.Phone), 1);
  assert.deepStrictEqual(findUnusedSlot([0], SlotType.SecurityKeyBackup), 160);
  assert.deepStrictEqual(findUnusedSlot([0, 1], SlotType.PasskeyBackup), 128);
  assert.deepStrictEqual(findUnusedSlot([0, 1], SlotType.Computer), 64);
  assert.deepStrictEqual(findUnusedSlot([0, 2], SlotType.Phone), 3);
  assert.deepStrictEqual(findUnusedSlot([0, 255], SlotType.Phone), 1);
  assert.deepStrictEqual(
    findUnusedSlot([0, 1, 2, 4, 5, 6, 7, 8, 9], SlotType.Phone),
    10
  );
  assert.deepStrictEqual(
    findUnusedSlot(
      [...Array(64).keys()].filter((i) => i !== 5), // All mobile slots except 5 are taken
      SlotType.Phone
    ),
    5
  );
  assert.deepStrictEqual(
    findUnusedSlot(
      [...Array(256).keys()].filter((i) => i !== 199), // All slots except seed phrase backup 7 are taken
      SlotType.SeedPhraseBackup
    ),
    199
  );
});
