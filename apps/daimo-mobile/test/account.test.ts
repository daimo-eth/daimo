import { assert } from "../src/logic/assert";
import { Account, parse, serialize } from "../src/model/account";

const correctSerV1 = `{"storageVersion":1,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test"}`;

const correctSerV2 = `{"storageVersion":2,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const lowercaseAddrV2 = `{"storageVersion":2,"name":"test","address":"0xef4396d9ff8107086d215a1c9f8866c54795d7c7","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const account: Account = {
  name: "test",
  address: "0x0000000000000000000000000000000000000123",
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

  it("fixes address checksum", () => {
    const a = parse(lowercaseAddrV2);
    expect(a?.address).toEqual("0xEf4396d9FF8107086d215a1c9f8866C54795D7c7");
  });

  it("migrates", () => {
    // Drop V1 accounts, testnet users re-onboard.
    const a = parse(correctSerV1);
    expect(a).toBeNull();
  });
});
