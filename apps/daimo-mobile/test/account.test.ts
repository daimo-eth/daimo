import { Account, parseAccount, serializeAccount } from "../src/model/account";

const correctSerV1 = `{"storageVersion":1,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test"}`;

const correctSerV2 = `{"storageVersion":2,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const lowercaseAddrV2 = `{"storageVersion":2,"name":"test","address":"0xef4396d9ff8107086d215a1c9f8866c54795d7c7","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const accountFromV2: Account = {
  enclaveKeyName: "test",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 0,
  lastFinalizedBlock: 0,

  namedAccounts: [],
  recentTransfers: [],

  pushToken: null,
};

const correctSerV3 = `{"storageVersion":3,"enclaveKeyName":"test","name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"pushToken":null}`;

const account: Account = {
  enclaveKeyName: "test",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 101,
  lastFinalizedBlock: 99,

  namedAccounts: [],
  recentTransfers: [],

  pushToken: null,
};

describe("Account", () => {
  it("serializes", async () => {
    const ser = serializeAccount(account);
    expect(ser).toEqual(correctSerV3);
  });

  it("deserializes", () => {
    const a = parseAccount(correctSerV3);
    expect(a).toEqual(account);
  });

  it("fixes address checksum", () => {
    const a = parseAccount(lowercaseAddrV2);
    expect(a?.address).toEqual("0xEf4396d9FF8107086d215a1c9f8866C54795D7c7");
  });

  it("migrates V1", () => {
    // Drop V1 accounts, testnet users re-onboard.
    const a = parseAccount(correctSerV1);
    expect(a).toBeNull();
  });

  it("migrates V2", () => {
    // Migrate V2 accounts.
    const a = parseAccount(correctSerV2);
    expect(a).toEqual(accountFromV2);
  });
});
