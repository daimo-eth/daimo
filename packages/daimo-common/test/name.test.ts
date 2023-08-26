import assert from "node:assert";
import test from "node:test";

import { validateName } from "../src/name";

test("validateName", () => {
  validateName("daimo");
  assert.throws(() => validateName("Daimo"));
  assert.throws(() => validateName(""));
  assert.throws(() => validateName("d"));
  assert.throws(() => validateName("012345678901234567890123456789012"));
  assert.throws(() => validateName("01234567890123456789012345678901"));
  assert.throws(() => validateName("⚡️asdf"));
  assert.throws(() => validateName(" asdf"));
  assert.throws(() => validateName("0age"));
  validateName("age0");
});
