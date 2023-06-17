import { assert } from "../src/logic/assert";
import { Account, parse, serialize } from "../src/model/account";

const correctSerV1 = `{"storageVersion":1,"name":"test","address":"0x123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test"}`;

const correctSerV2 = `{"storageVersion":2,"name":"test","address":"0x123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const account: Account = {
  name: "test",
  address: "0x123",
  lastBalance: BigInt(123),
  lastNonce: BigInt(456),
  lastBlockTimestamp: 789,
  enclaveKeyName: "test",
  pushToken: null,
};

describe("Account", () => {
  it("serializes", async () => {
    const ser = await serialize(account);
    expect(ser).toEqual(correctSerV2);
  });

  it("deserializes", () => {
    const a = parse(correctSerV2);
    assert(a != null);
    expect(a).toEqual(account);
  });

  it("migrates", () => {
    // Drop V1 accounts, testnet users re-onboard.
    const a = parse(correctSerV1);
    expect(a).toBeNull();
  });
});
