import { Account, parseAccount, serializeAccount } from "../src/model/account";

const correctSerV7 = `{"storageVersion":7,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"namedAccounts":[],"accountKeys":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0},"pushToken":null}`;

const correctSerV8 = `{"storageVersion":8,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456"},"pushToken":null}`;
const correctSerV9 = `{"storageVersion":9,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null}`;

const lowercaseAddrV9 = `{"storageVersion":9,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0xef4396d9ff8107086d215a1c9f8866c54795d7c7","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"trackedRequests":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0},"pushToken":null}`;

const account: Account = {
  enclaveKeyName: "test",
  enclavePubKey:
    "0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",

  homeChainId: 84531, // Base Goerli
  homeCoinAddress: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf",

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 101,
  lastFinalizedBlock: 99,

  namedAccounts: [],
  recentTransfers: [],
  trackedRequests: [],
  pendingNotes: [],
  accountKeys: [],
  pendingKeyRotation: [],

  chainGasConstants: {
    maxPriorityFeePerGas: "0",
    maxFeePerGas: "0",
    estimatedFee: 0,
    paymasterAddress: "0x0000000000000000000000000000000000000456",
    preVerificationGas: "0",
  },

  pushToken: null,
};

describe("Account", () => {
  it("serializes", async () => {
    const ser = serializeAccount(account);
    expect(ser).toEqual(correctSerV9);
  });

  it("deserializes", () => {
    const a = parseAccount(correctSerV9);
    expect(a).toEqual(account);
  });

  it("fixes address checksum", () => {
    const a = parseAccount(lowercaseAddrV9);
    expect(a?.address).toEqual("0xEf4396d9FF8107086d215a1c9f8866C54795D7c7");
  });

  it("drops old accounts to V7", () => {
    // Drop V7 accounts, testnet users re-onboard.
    const a = parseAccount(correctSerV7);
    expect(a).toBeNull();
  });

  it("migrates V8 correctly", () => {
    // Adds pendingKeyRotation
    const a = parseAccount(correctSerV8);
    expect(a).toEqual(account);
  });
});
