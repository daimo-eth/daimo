import { DaimoLink, formatDaimoLink, parseDaimoLink } from "../src/logic/link";

describe("Daimo deep link", () => {
  it("[de]serializes", () => {
    const examples: [string, DaimoLink][] = [
      [
        "daimo://receive/0x1234567890123456789012345678901234567890",
        {
          type: "receive",
          addr: "0x1234567890123456789012345678901234567890",
        },
      ],
    ];
    for (const [str, link] of examples) {
      const ser = formatDaimoLink(link);
      expect(ser).toEqual(str);

      const deser = parseDaimoLink(str);
      expect(deser).toEqual(link);
    }
  });

  it("handles missing or invalid links", () => {
    expect(parseDaimoLink("")).toEqual(null);
    expect(parseDaimoLink("asdf")).toEqual(null);
    expect(parseDaimoLink("https://google.com")).toEqual(null);
    expect(parseDaimoLink("daimo://receive/")).toEqual(null);
    expect(parseDaimoLink("daimo://receive/foo/bar")).toEqual(null);
    expect(parseDaimoLink("daimo://receive/notanaddress")).toEqual(null);
    expect(parseDaimoLink("daimo://receive/0x123")).toEqual(null);
  });
});
