import { Account, parseAccount, serializeAccount } from "../src/model/account";

const correctSerV2 = `{"storageVersion":2,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const lowercaseAddrV5 = `{"storageVersion":5,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0xef4396d9ff8107086d215a1c9f8866c54795d7c7","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"namedAccounts":[],"accountKeys":[],"pushToken":null}`;

const correctSerV5 = `{"storageVersion":5,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"namedAccounts":[],"accountKeys":[],"pushToken":null}`;

const correctSerV6 = `{"storageVersion":6,"enclaveKeyInfo":{"name":"test","forceWeakerKeys":false},"enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"namedAccounts":[],"accountKeys":[],"pushToken":null}`;

const account: Account = {
  enclaveKeyInfo: {
    name: "test",
    forceWeakerKeys: false,
  },
  enclavePubKey:
    "0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 101,
  lastFinalizedBlock: 99,

  namedAccounts: [],
  recentTransfers: [],
  trackedRequests: [],
  accountKeys: [],

  pushToken: null,
};

describe("Account", () => {
  it("serializes", async () => {
    const ser = serializeAccount(account);
    expect(ser).toEqual(correctSerV6);
  });

  it("deserializes", () => {
    const a = parseAccount(correctSerV6);
    expect(a).toEqual(account);
  });

  it("fixes address checksum", () => {
    const a = parseAccount(lowercaseAddrV5);
    expect(a?.address).toEqual("0xEf4396d9FF8107086d215a1c9f8866C54795D7c7");
  });

  it("migrates V2", () => {
    // Drop V2 accounts, testnet users re-onboard.
    const a = parseAccount(correctSerV2);
    expect(a).toBeNull();
  });

  it("migrates V5", () => {
    // Migrate V5 accounts.
    const a = parseAccount(correctSerV5);
    expect(a).toEqual(account);
  });
});
