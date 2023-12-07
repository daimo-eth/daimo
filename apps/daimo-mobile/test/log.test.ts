import { getDebugLog, initDebugLog } from "../src/common/debugLog";

describe("debugLog", () => {
  initDebugLog();

  const getLines = () =>
    getDebugLog([])
      .replace(/^2[^ ]*Z /gm, "")
      .split("\n");

  it("records console logs", () => {
    console.log("hello");
    console.warn("world");
    console.error("error");

    expect(getLines()).toStrictEqual([
      "# Daimo Debug Log",
      "",
      "log hello",
      "WRN world",
      "ERR error",
      "- debug log captured",
    ]);
  });

  it("handles JSON and non-JSON objects", () => {
    console.log("a", { a: 1 });
    console.log("b", 123n);
    const circular = {} as any;
    circular["circular"] = circular;
    console.log("c", circular);

    expect(getLines().slice(5)).toStrictEqual([
      'log a {"a":1}',
      "log b 123",
      "log c [object Object]",
      "- debug log captured",
    ]);
  });

  it("handles errors", () => {
    console.error(new Error("test"));
    const lines = getLines().slice(8);

    expect(lines[0]).toBe("ERR Error: test");
    expect(lines[1]).toMatch(/at Object\.<anonymous> \(.*\/log.test.ts/);
  });
});
