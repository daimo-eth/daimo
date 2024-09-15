import { baseETH, baseUSDC, optimismUSDC, polygonUSDC } from "@daimo/contract";
import assert from "node:assert";
import test from "node:test";

import {
  DaimoLink,
  DaimoLinkRequest,
  formatDaimoLink,
  formatDaimoLinkDirect,
  parseDaimoLink,
} from "../src/daimoLink";

const testCases: [string, DaimoLink | null][] = [
  [
    "https://daimo.com/l/settings/add-passkey",
    { type: "settings", screen: "add-passkey" },
  ],
  [
    "https://daimo.com/l/account/dcposch",
    { type: "account", account: "dcposch" },
  ],
  [
    "https://daimo.com/l/account/dcposch.eth",
    { type: "account", account: "dcposch.eth" },
  ],
  [
    "https://daimo.com/l/account/0x061b0a794945fe0ff4b764bfb926317f3cfc8b93",
    { type: "account", account: "0x061b0a794945fe0ff4b764bfb926317f3cfc8b93" },
  ],
  ["https://daimo.com/l/account/0x0", { type: "account", account: "0x0" }],
  [
    "https://daimo.com/l/request?to=0x1111111111111111111111111111111111111111&n=1.23&id=123&c=8453&t=usdc",
    {
      type: "request",
      recipient: "0x1111111111111111111111111111111111111111",
      dollars: "1.23",
      requestId: "123",
      toCoin: baseUSDC,
    },
  ],
  [
    "https://daimo.com/l/request?to=dcposch.eth&n=4.20&id=555&c=8453&t=usdc",
    {
      type: "request",
      recipient: "dcposch.eth",
      dollars: "4.20",
      requestId: "555",
      toCoin: baseUSDC,
    },
  ],
  [
    "https://daimo.com/l/n/foo/1.23/JrXdV#rqNoihPnZKa7g51uoUctj",
    {
      type: "notev2",
      sender: "foo",
      dollars: "1.23",
      id: "JrXdV",
      seed: "rqNoihPnZKa7g51uoUctj",
    },
  ],
  [
    "https://daimo.com/l/n/bar.eth/4.20/rqNoi",
    {
      type: "notev2",
      sender: "bar.eth",
      dollars: "4.20",
      id: "rqNoi",
      seed: undefined,
    },
  ],
  [
    "https://daimo.com/l/r/foo/1.23/Sh4J3o7iau",
    {
      type: "requestv2",
      recipient: "foo",
      dollars: "1.23",
      id: "Sh4J3o7iau",
    },
  ],
  [
    "https://daimo.com/l/r/bar.eth/22.00/2d1pzPgSTRZ",
    {
      type: "requestv2",
      recipient: "bar.eth",
      dollars: "22.00",
      id: "2d1pzPgSTRZ",
    },
  ],
  [
    "https://daimo.com/l/r/alice/9.87/2d1pzPgSTRZ?memo=Hello%20world",
    {
      type: "requestv2",
      recipient: "alice",
      dollars: "9.87",
      id: "2d1pzPgSTRZ",
      memo: "Hello world",
    },
  ],
  ["https://daimo.com/l", null],
  ["https://daimo.com/l/foo", null],
  ["https://daimo.com/l/account", null],
  ["https://daimo.com/l/request", null],
  ["https://daimo.com/l/request/", null],
  [
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.1.1&id=123",
    null,
  ],
  [
    "https://daimo.com/l/request?to=andrewliu&n=1.23&id=123&c=8453&t=usdc",
    null,
  ],
  [
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&c=1",
    null,
  ],
  [
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&t=usdc",
    null,
  ],
  [
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&c=1&t=matic",
    null,
  ],
  ["https://daimo.com/l/note/", null],
  ["https://daimo.com/l/note/0x0", null],
  [
    "https://daimo.com/l/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#foo",
    null,
  ],
  [
    "https://daimo.com/l/note/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93#0x0#",
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
    "https://daimo.com/link/account/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
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
    "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.00001/123",
    "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.0/123",
    "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1/123",
    "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1/123",
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.00001&id=123&c=8453&t=usdc",
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.0&id=123&c=8453&t=usdc",
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1&id=123&c=8453&t=usdc",
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.00&id=123&c=8453&t=usdc",
  ];
  const correct =
    "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.00&id=123&c=8453&t=usdc";

  for (const variant of variants) {
    const roundtrip = formatDaimoLink(parseDaimoLink(variant)!);
    assert.strictEqual(roundtrip, correct);
  }
});

test("Old DaimoLinkRequest parsing", () => {
  const linkTestCases: [string, DaimoLinkRequest | null][] = [
    [
      "https://daimo.com/l/request/dcposch/1.23/123",
      {
        type: "request",
        recipient: "dcposch",
        dollars: "1.23",
        requestId: "123",
        toCoin: baseUSDC,
      },
    ],
    [
      "https://daimo.com/l/request/dcposch.eth/4.20/555",
      {
        type: "request",
        recipient: "dcposch.eth",
        dollars: "4.20",
        requestId: "555",
        toCoin: baseUSDC,
      },
    ],
    ["https://daimo.com/l/request?to=0x0", null],
    [
      "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/1.1.1/123",
      null,
    ],
    [
      "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93///1.1",
      null,
    ],
    [
      "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/-1.12/123",
      null,
    ],
    [
      "https://daimo.com/l/request/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93/0.001/123",
      null,
    ],
  ];
  for (const [url, link] of linkTestCases) {
    assert.deepStrictEqual(parseDaimoLink(url), link);
  }
});

test("New DaimoLinkRequest parsing", () => {
  const linkTestCases: [string, DaimoLinkRequest | null][] = [
    // No amount
    [
      "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&id=123&c=10&t=usdc",
      {
        type: "request",
        recipient: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
        toCoin: optimismUSDC,
        requestId: "123",
      },
    ],
    // No request id
    [
      "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.23&c=10&t=usdc",
      {
        type: "request",
        recipient: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
        toCoin: optimismUSDC,
        dollars: "1.23",
      },
    ],
    // Receive on Polygon
    [
      "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.23&c=137&t=usdc",
      {
        type: "request",
        recipient: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
        toCoin: polygonUSDC,
        dollars: "1.23",
      },
    ],
    // Receive $1.23 worth of Base ETH
    [
      "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.23&c=8453&t=eth",
      {
        type: "request",
        recipient: "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93",
        toCoin: baseETH,
        dollars: "1.23",
      },
    ],
    // Invalid chain
    [
      "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.23&c=999999999999&t=usdc",
      null,
    ],
    // Invalid coin
    [
      "https://daimo.com/l/request?to=0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93&n=1.23&c=8453&t=wubbalubba",
      null,
    ],
  ];
  for (const [url, link] of linkTestCases) {
    assert.deepStrictEqual(parseDaimoLink(url), link);
  }
});

test("DaimoLink note backcompat", () => {
  const oldUrl =
    "https://daimo.com/l/note/foo/1.23/0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
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
      url.replace("https://daimo.com/l/", "daimo://")
    );
  }
});
