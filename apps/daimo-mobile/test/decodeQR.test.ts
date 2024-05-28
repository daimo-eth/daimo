import { decodeQR } from "../src/logic/decodeQR";

describe("decodeQR", () => {
  it("handles bare addresses", () => {
    const data = "0xf0fc94DCDC04b2400E5EEac6Aba35cC87d1954D0";
    const link = `daimo://account/${data}`;

    const decoded = decodeQR(data);
    expect(decoded).toEqual(link);
  });

  it("rejects random links", () => {
    expect(decodeQR("foo")).toEqual(null);
    expect(decodeQR("https://google.com")).toEqual(null);
  });

  it("handles Metamask-style ethereum: links", () => {
    const addr = "0xf0fc94DCDC04b2400E5EEac6Aba35cC87d1954D0";
    const link = `daimo://account/${addr}`;

    expect(decodeQR(`ethereum:${addr}`)).toEqual(link);
  });

  it("handles Gnosis-style  base: links", () => {
    const addr = "0xf0fc94DCDC04b2400E5EEac6Aba35cC87d1954D0";
    const link = `daimo://account/${addr}`;

    expect(decodeQR(`eth:${addr}`)).toEqual(link);
    expect(decodeQR(`base:${addr}`)).toEqual(link);
    expect(decodeQR(`opt:${addr}`)).toEqual(null);
  });

  it("handles Coinbase-style ethereum:// links", () => {
    const usdbc = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";
    const user = "0x06EbEC785501e5Cd28aA5DF8BeDB71c2871dCD01";

    const coinbaseQR = `ethereum:${usdbc}@8453/transfer?address=${user}`;
    const otherChain = `ethereum:${usdbc}@8888/transfer?address=${user}`;
    const otherFunction = `ethereum:${usdbc}@8453/foobar?address=${user}`;

    expect(decodeQR(coinbaseQR)).toEqual(`daimo://account/${user}`);
    expect(decodeQR(otherChain)).toEqual(null);
    expect(decodeQR(otherFunction)).toEqual(null);
  });
});
