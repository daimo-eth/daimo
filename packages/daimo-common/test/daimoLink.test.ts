import assert from "node:assert";
import test from "node:test";

import { DaimoLink, formatDaimoLink, parseDaimoLink } from "../src/daimoLink";

const testCases: [string, DaimoLink | null][] = [
  [
    "https://example.com/link/account/dcposch",
    { type: "account", account: "dcposch" },
  ],
  [
    "https://example.com/link/account/dcposch.eth",
    { type: "account", account: "dcposch.eth" },
  ],
  [
    "https://example.com/link/account/0x061b0a794945fe0ff4b764bfb926317f3cfc8b93",
    { type: "account", account: "0x061b0a794945fe0ff4b764bfb926317f3cfc8b93" },
  ],
  ["https://example.com/link/account/0x0", { type: "account", account: "0x0" }],
  [
    "https://example.com/link/request/dcposch/1.23/123",
    {
      type: "request",
      recipient: "dcposch",
      dollars: "1.23",
      requestId: "123",
    },
  ],
  [
    "https://example.com/link/request/dcposch.eth/4.20/555",
    {
      type: "request",
      recipient: "dcposch.eth",
      dollars: "4.20",
      requestId: "555",
    },
  ],
  [
    "https://example.com/link/note/foo/1.23/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
    {
      type: "note",
      previewSender: "foo",
      previewDollars: "1.23",
      ephemeralOwner: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
      ephemeralPrivateKey: undefined,
    },
  ],
  [
    "https://example.com/link/note/bar.eth/4.20/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#0x1234",
    {
      type: "note",
      previewSender: "bar.eth",
      previewDollars: "4.20",
      ephemeralOwner: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
      ephemeralPrivateKey: "0x1234",
    },
  ],
  ["https://example.com/link", null],
  ["https://example.com/link/foo", null],
  ["https://example.com/link/account", null],
  ["https://example.com/link/request", null],
  ["https://example.com/link/request/", null],
  ["https://example.com/link/request/0x0", null],
  [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.1.1/123",
    null,
  ],
  [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93///1.1",
    null,
  ],
  [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/-1.12/123",
    null,
  ],
  [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/0.001/123",
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

test("DaimoLink from daimo:// direct app link", () => {
  const url = "daimo://account/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
  assert.deepStrictEqual(parseDaimoLink(url), {
    type: "account",
    account: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
  });
});

test("DaimoLink normalization", () => {
  for (const [url, link] of testCases) {
    // Ensure addresses always end up checksummed
    assert.deepStrictEqual(parseDaimoLink(url.toLowerCase()), link);
  }

  // Ensure that amount is normalized
  const variants = [
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.00001/123",
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.0/123",
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1/123",
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1/123",
  ];
  const correct =
    "https://example.com/link/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.00/123";

  for (const variant of variants) {
    const roundtrip = formatDaimoLink(parseDaimoLink(variant)!);
    assert.strictEqual(roundtrip, correct);
  }
});

test("DaimoLink note backcompat", () => {
  const oldUrl =
    "https://example.com/link/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#0x1234";
  const link = parseDaimoLink(oldUrl)!;
  assert.deepStrictEqual(link, {
    type: "note",
    previewSender: "unknown",
    previewDollars: "0.00",
    ephemeralOwner: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
    ephemeralPrivateKey: "0x1234",
  });
});
