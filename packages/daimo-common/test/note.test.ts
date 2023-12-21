import assert from "node:assert";
import test from "node:test";
import { keccak256, verifyMessage } from "viem";

import {
  generateNoteSeedAddress,
  getNoteClaimSignatureFromSeed,
} from "../src/note.ts";

test("testSeedRoundTrip", async () => {
  const [seed, address] = generateNoteSeedAddress();
  const rec = `0x456`;
  const signature = await getNoteClaimSignatureFromSeed(`0x123`, rec, seed);
  const message = keccak256(rec);
  const valid = await verifyMessage({
    address,
    message: { raw: message },
    signature,
  });
  assert(valid);
});
