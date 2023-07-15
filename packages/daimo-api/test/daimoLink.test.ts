import assert from "node:assert";
import test from "node:test";

import { parseDaimoLink, formatDaimoLink, DaimoLink } from "../src/daimoLink";

const testCases: [string, DaimoLink | null][] = [
  [
    "https://example.com/link/account/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
    { type: "account", addr: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93" },
  ],
  [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.23",
    {
      type: "request",
      recipient: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
      amount: "1.23",
    },
  ],
  [
    "https://example.com/link/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
    {
      type: "note",
      ephemeralOwner: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
      ephemeralPrivateKey: undefined,
    },
  ],
  [
    "https://example.com/link/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#0x1234",
    {
      type: "note",
      ephemeralOwner: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
      ephemeralPrivateKey: "0x1234",
    },
  ],
  ["https://example.com/link", null],
  ["https://example.com/link/foo", null],
  ["https://example.com/link/account", null],
  ["https://example.com/link/account/0x0", null],
  ["https://example.com/link/request", null],
  ["https://example.com/link/request/", null],
  ["https://example.com/link/request/0x0", null],
  [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.1.1",
    null,
  ],
  ["https://example.com/link/note/", null],
  ["https://example.com/link/note/0x0", null],
  [
    "https://example.com/link/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#foo",
    null,
  ],
  [
    "https://example.com/link/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#0x0#",
    null,
  ],
];

test("DaimoLink", () => {
  for (const [url, link] of testCases) {
    assert.deepStrictEqual(parseDaimoLink(url), link);
    if (link != null) {
      assert.deepStrictEqual(formatDaimoLink(link), url);
    }
  }
});
