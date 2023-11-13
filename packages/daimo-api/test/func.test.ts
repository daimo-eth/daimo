import assert from "node:assert";
import test from "node:test";

import { memoize } from "../src/utils/func";

test("memoize", () => {
  let callCount = 0;

  const double = (i: number) => {
    callCount++;
    return i * 2;
  };

  const memoizedDouble = memoize(double);

  assert.strictEqual(memoizedDouble(2), 4);
  assert.strictEqual(callCount, 1);
  assert.strictEqual(memoizedDouble(3), 6);
  assert.strictEqual(callCount, 2);
  assert.strictEqual(memoizedDouble(2), 4);
  assert.strictEqual(memoizedDouble(3), 6);
  assert.strictEqual(callCount, 2);
});
