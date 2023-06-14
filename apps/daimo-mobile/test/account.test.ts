import { Account, parse, serialize } from "../src/logic/account";
import { assert } from "../src/logic/assert";

const correctSer = `{"storageVersion":1,"name":"test","address":"0x123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test"}`;

describe("Account", () => {
  it("serializes", async () => {
    const a: Account = {
      name: "test",
      address: "0x123",
      lastBalance: BigInt(123),
      lastNonce: BigInt(456),
      lastBlockTimestamp: 789,
      enclaveKeyName: "test",
    };
    const ser = await serialize(a);
    expect(ser).toEqual(correctSer);
  });

  it("deserializes", () => {
    const a = parse(correctSer);
    assert(a != null);
    expect(a).toEqual({
      name: "test",
      address: "0x123",
      lastBalance: BigInt(123),
      lastNonce: BigInt(456),
      lastBlockTimestamp: 789,
      enclaveKeyName: "test",
    });
  });
});
