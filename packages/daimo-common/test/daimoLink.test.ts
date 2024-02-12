import assert from "node:assert";
import test from "node:test";

import {
  DaimoLink,
  formatDaimoLink,
  formatDaimoLinkDirect,
  parseDaimoLink,
} from "../src/daimoLink";

const testCases: [string, DaimoLink | null][] = [
  [
    "https://example.com/l/settings/add-passkey",
    { type: "settings", screen: "add-passkey" },
  ],
  [
    "https://example.com/l/account/dcposch",
    { type: "account", account: "dcposch" },
  ],
  [
    "https://example.com/l/account/dcposch.eth",
    { type: "account", account: "dcposch.eth" },
  ],
  [
    "https://example.com/l/account/0x061b0a794945fe0ff4b764bfb926317f3cfc8b93",
    { type: "account", account: "0x061b0a794945fe0ff4b764bfb926317f3cfc8b93" },
  ],
  ["https://example.com/l/account/0x0", { type: "account", account: "0x0" }],
  [
    "https://example.com/l/request/dcposch/1.23/123",
    {
      type: "request",
      recipient: "dcposch",
      dollars: "1.23",
      requestId: "123",
    },
  ],
  [
    "https://example.com/l/request/dcposch.eth/4.20/555",
    {
      type: "request",
      recipient: "dcposch.eth",
      dollars: "4.20",
      requestId: "555",
    },
  ],
  [
    "https://example.com/l/n/foo/1.23/JrXdV#rqNoihPnZKa7g51uoUctj",
    {
      type: "notev2",
      sender: "foo",
      dollars: "1.23",
      id: "JrXdV",
      seed: "rqNoihPnZKa7g51uoUctj",
    },
  ],
  [
    "https://example.com/l/n/bar.eth/4.20/rqNoi",
    {
      type: "notev2",
      sender: "bar.eth",
      dollars: "4.20",
      id: "rqNoi",
      seed: undefined,
    },
  ],
  [
    "https://example.com/l/r/foo/1.23/Sh4J3o7iau",
    {
      type: "requestv2",
      recipient: "foo",
      dollars: "1.23",
      id: "Sh4J3o7iau",
    },
  ],
  [
    "https://example.com/l/r/bar.eth/22.00/2d1pzPgSTRZ",
    {
      type: "requestv2",
      recipient: "bar.eth",
      dollars: "22.00",
      id: "2d1pzPgSTRZ",
    },
  ],
  ["https://example.com/l", null],
  ["https://example.com/l/foo", null],
  ["https://example.com/l/account", null],
  ["https://example.com/l/request", null],
  ["https://example.com/l/request/", null],
  ["https://example.com/l/request/0x0", null],
  [
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.1.1/123",
    null,
  ],
  [
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93///1.1",
    null,
  ],
  [
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/-1.12/123",
    null,
  ],
  [
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/0.001/123",
    null,
  ],
  ["https://example.com/l/note/", null],
  ["https://example.com/l/note/0x0", null],
  [
    "https://example.com/l/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#foo",
    null,
  ],
  [
    "https://example.com/l/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#0x0#",
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

  assert.deepStrictEqual(parseDaimoLink(`daimo://settings`), {
    type: "settings",
    screen: undefined,
  });
});

test("DaimoLink from https://daimo.xyz legacy URL", () => {
  const url =
    "https://daimo.xyz/link/account/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
  assert.deepStrictEqual(parseDaimoLink(url), {
    type: "account",
    account: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
  });
});

test("DaimoLink from /link/ legacy prefix", () => {
  const url =
    "https://example.com/link/account/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
  assert.deepStrictEqual(parseDaimoLink(url), {
    type: "account",
    account: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
  });
});

test("DaimoLink normalization", () => {
  // Ensure addresses always end up checksummed
  for (const [url, link] of testCases) {
    // Base58 encoding is case sensitive
    if (["notev2", "requestv2"].includes(link?.type ?? "")) continue;
    assert.deepStrictEqual(parseDaimoLink(url.toLowerCase()), link);
  }

  // Ensure that amount is normalized
  const variants = [
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.00001/123",
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.0/123",
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1/123",
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1/123",
  ];
  const correct =
    "https://example.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.00/123";

  for (const variant of variants) {
    const roundtrip = formatDaimoLink(parseDaimoLink(variant)!);
    assert.strictEqual(roundtrip, correct);
  }
});

test("DaimoLink note backcompat", () => {
  const oldUrl =
    "https://example.com/l/note/foo/1.23/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
  const link = parseDaimoLink(oldUrl)!;
  assert.deepStrictEqual(link, {
    type: "note",
    previewSender: "foo",
    previewDollars: "1.23",
    ephemeralOwner: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
    ephemeralPrivateKey: undefined,
  });
});

test("DaimoLink format direct link", () => {
  const link: DaimoLink = { type: "account", account: "dcposch" };
  assert.equal(formatDaimoLinkDirect(link), "daimo://account/dcposch");

  for (const [url, link] of testCases) {
    if (link == null) continue;
    assert.equal(
      formatDaimoLinkDirect(link),
      url.replace("https://example.com/l/", "daimo://")
    );
  }
});
