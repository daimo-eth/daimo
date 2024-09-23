import assert from "node:assert";
import test from "node:test";

import { assertNotNull } from "../src/assert";
import { CurrencyExchangeRate, nonUsdCurrencies } from "../src/currencies";
import { debugJson } from "../src/debug";
import { getFullMemo } from "../src/format";
import { usdEntry } from "../src/moneyEntry";

test("getFullMemo", async (t) => {
  const ars = assertNotNull(nonUsdCurrencies.find((c) => c.symbol === "ARS"));
  const arsRate: CurrencyExchangeRate = { ...ars, rateUSD: 1000 };

  await t.test("none", () => {
    const ret = getFullMemo({
      money: usdEntry(123),
    });
    assert.strictEqual(ret, "");
  });

  await t.test("basic", () => {
    const ret = getFullMemo({
      memo: "🔥 bbq",
      money: usdEntry(123),
    });
    assert.strictEqual(ret, "🔥 bbq");
  });

  await t.test("foreign currency", () => {
    const ret = getFullMemo({
      memo: "🔥 asado",
      money: { currency: arsRate, dollars: 0.2, localUnits: 200 },
    });
    assert.strictEqual(ret, "🔥 asado · ARS200");
  });
});

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
