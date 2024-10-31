import test from "tape";
import { base58, base32crockford } from "@scure/base";
import { encodeRequestId, decodeRequestIdString } from "../src/request";
import { getNoteId, generateNoteSeedAddress, getNoteClaimSignatureFromSeed } from "../src/note";
import { hexToBytes } from "viem";

test("request ID encoding", async (t) => {
  // Test new base32 encoding
  const testId = BigInt(12345);
  const encoded = encodeRequestId(testId);
  t.equal(decodeRequestIdString(encoded), testId, "base32 encoding/decoding works");
  t.ok(/^[0123456789abcdefghjkmnpqrstvwxyz]+$/.test(encoded), "encoded ID only contains base32crockford characters");

  // Test backward compatibility with base58
  const oldBase58Encoded = base58.encode(hexToBytes("0x1234"));
  const decoded = decodeRequestIdString(oldBase58Encoded);
  t.ok(decoded, "can decode legacy base58 encoded IDs");
});

test("note ID encoding", async (t) => {
  const testAddress = "0x1234567890123456789012345678901234567890";
  const noteId = getNoteId(testAddress);
  t.ok(noteId.length === 5, "note ID has correct length");
  t.ok(/^[0123456789abcdefghjkmnpqrstvwxyz]+$/.test(noteId), "note ID only contains base32crockford characters");
});

test("note seed encoding", async (t) => {
  // Test generating new seeds
  const [seed, address] = generateNoteSeedAddress();
  t.ok(/^[0123456789abcdefghjkmnpqrstvwxyz]+$/.test(seed), "generated seed only contains base32crockford characters");
  t.ok(address.startsWith("0x"), "generated address is valid ethereum address");

  // Test backward compatibility with base58 seeds
  const oldSeed = base58.encode(hexToBytes("0x1234"));
  const sig = await getNoteClaimSignatureFromSeed(
    "0x1234567890123456789012345678901234567890",
    "0x0987654321098765432109876543210987654321",
    oldSeed
  );
  t.ok(sig, "can use legacy base58 encoded seeds");
});
