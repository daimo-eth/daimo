import assert from "node:assert";
import test from "node:test";

import { debugJson } from "../src/debug";

test("debugJson", async (t) => {
  await t.test("should convert simple object to JSON", () => {
    const input = { foo: 123 };
    const result = debugJson(input);
    assert.strictEqual(result, '{"foo":123}');
  });

  await t.test("should truncate output to 1000 characters", () => {
    const input = new Array(1234).fill(0).map((_, i) => i); // >1KB of JSON
    const result = debugJson(input);
    assert.strictEqual(result.length, 1000); // 1000 chars max output
  });

  await t.test("should handle BigInt", () => {
    const input = { bar: BigInt(123) };
    const result = debugJson(input);
    assert.strictEqual(result, '{"bar":"123"}');
  });

  await t.test("should return error message on JSON stringify failure", () => {
    const circular: any = {};
    circular.self = circular;
    const result = debugJson(circular);
    assert.match(result, /^<JSON error: /);
  });
});
