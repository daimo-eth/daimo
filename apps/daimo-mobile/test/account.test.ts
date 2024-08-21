import { assertNotNull } from "@daimo/common";

import largeAccountV15 from "./assets/accountDcposchV15.json";
import {
  Account,
  parseAccount,
  serializeAccount,
} from "../src/storage/account";

const correctSerV7 = `{"storageVersion":7,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"accountKeys":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0},"pushToken":null}`;
const correctSerV8 = `{"storageVersion":8,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456"},"pushToken":null}`;
const correctSerV9 = `{"storageVersion":9,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null}`;
const correctSerV10 = `{"storageVersion":10,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null}`;
const correctSerV11 = `{"storageVersion":11,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"suggestedActions":[],"dismissedActionIDs":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null}`;
const correctSerV12 = `{"storageVersion":12,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"suggestedActions":[],"dismissedActionIDs":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null,"linkedAccounts":[],"inviteLinkStatus":null,"invitees":[]}`;
const lowercaseAddrV13 = `{"storageVersion":13,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0xef4396d9ff8107086d215a1c9f8866c54795d7c7","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"pendingNotes":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0},"pushToken":null}`;
const correctSerV13 = `{"storageVersion":13,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"suggestedActions":[],"dismissedActionIDs":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null,"linkedAccounts":[],"inviteLinkStatus":null,"invitees":[],"isOnboarded":true}`;
const correctSerV14 = `{"storageVersion":14,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"suggestedActions":[],"dismissedActionIDs":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null,"linkedAccounts":[],"inviteLinkStatus":null,"invitees":[],"isOnboarded":true,"notificationRequestStatuses":[],"lastReadNotifTimestamp":0,"proposedSwaps":[],"exchangeRates":[],"sentPaymentLinks":[]}`;
const correctSerV15 = `{"storageVersion":15,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"suggestedActions":[],"dismissedActionIDs":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null,"linkedAccounts":[],"inviteLinkStatus":null,"invitees":[],"isOnboarded":true,"notificationRequestStatuses":[],"lastReadNotifTimestamp":0,"proposedSwaps":[],"exchangeRates":[],"sentPaymentLinks":[],"landlineSessionURL":"","landlineAccounts":[]}`;
const correctSerV16 = `{"storageVersion":16,"enclaveKeyName":"test","enclavePubKey":"0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456","name":"test","address":"0x0000000000000000000000000000000000000123","homeChainId":84531,"homeCoinAddress":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"accountKeys":[],"pendingKeyRotation":[],"recommendedExchanges":[],"suggestedActions":[],"dismissedActionIDs":[],"chainGasConstants":{"maxPriorityFeePerGas":"0","maxFeePerGas":"0","estimatedFee":0,"paymasterAddress":"0x0000000000000000000000000000000000000456","preVerificationGas":"0"},"pushToken":null,"linkedAccounts":[],"inviteLinkStatus":null,"invitees":[],"isOnboarded":true,"notificationRequestStatuses":[],"lastReadNotifTimestamp":0,"proposedSwaps":[],"exchangeRates":[],"sentPaymentLinks":[],"landlineSessionURL":"","landlineAccounts":[]}`;

const account: Account = {
  enclaveKeyName: "test",
  enclavePubKey:
    "0x3059301306072a8648ce3d020106082a8648ce3d0301070342000400000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",

  homeChainId: 84531, // Base Goerli (old testnet)
  homeCoinAddress: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf",

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 101,
  lastFinalizedBlock: 99,

  namedAccounts: [],
  recentTransfers: [],
  accountKeys: [],
  pendingKeyRotation: [],
  recommendedExchanges: [],
  suggestedActions: [],
  dismissedActionIDs: [],

  chainGasConstants: {
    maxPriorityFeePerGas: "0",
    maxFeePerGas: "0",
    estimatedFee: 0,
    paymasterAddress: "0x0000000000000000000000000000000000000456",
    preVerificationGas: "0",
  },

  pushToken: null,

  linkedAccounts: [],
  inviteLinkStatus: null,
  invitees: [],

  isOnboarded: true,

  notificationRequestStatuses: [],
  lastReadNotifTimestamp: 0,
  proposedSwaps: [],
  exchangeRates: [],
  sentPaymentLinks: [],

  landlineSessionURL: "",
  landlineAccounts: [],
};

describe("Account", () => {
  it("serialize", async () => {
    const ser = serializeAccount(account);
    expect(ser).toEqual(correctSerV16);
  });

  it("deserialize", () => {
    const a = parseAccount(correctSerV16);
    expect(a).toEqual(account);
  });

  it("fix address checksum", () => {
    const a = parseAccount(lowercaseAddrV13);
    expect(a?.address).toEqual("0xEf4396d9FF8107086d215a1c9f8866C54795D7c7");
    expect(a?.isOnboarded).toEqual(true);
  });

  it("drop old accounts to V7", () => {
    // Drop V7 accounts, testnet users re-onboard.
    const a = parseAccount(correctSerV7);
    expect(a).toBeNull();
  });

  it("migrate V8", () => {
    // Adds pendingKeyRotation
    const a = parseAccount(correctSerV8);
    expect(a).toEqual(account);
  });

  it("migrate V9", () => {
    // Adds recommendedExchanges
    const a = parseAccount(correctSerV9);
    expect(a).toEqual(account);
  });

  it("migrate V10", () => {
    // Adds suggestedActions, dismissedActionIDs
    const a = parseAccount(correctSerV10);
    expect(a).toEqual(account);
  });

  it("migrate V11", () => {
    // Removes pendingNotes, changes transferLogs
    const a = parseAccount(correctSerV11);
    expect(a).toEqual(account);
  });

  it("migrate V12", () => {
    // Adds inviteLinkStatus, invitees
    const a = parseAccount(correctSerV12);
    expect(a).toEqual(account);
  });

  it("migrate V13", () => {
    // Adds requests
    const a = parseAccount(correctSerV13);
    expect(a).toEqual(account);
  });

  it("migrate V14", () => {
    // Adds exchangeRates, sentPaymentLinks
    const a = parseAccount(correctSerV14);
    expect(a).toEqual(account);
  });

  it("migrate V15", () => {
    // Adds landlineSessionURL, landlineAccounts
    const a = parseAccount(correctSerV15);
    expect(a).toEqual(account);
  });

  it("migrate V16", () => {
    // Adds landlineSessionURL, landlineAccounts
    const a = parseAccount(correctSerV16);
    expect(a).toEqual(account);
  });
});

describe("LargeAccount", () => {
  it("migrate", () => {
    const acc = parseAccount(JSON.stringify(largeAccountV15));

    expect(acc).not.toBeNull();
    expect(acc?.name).toBe("dcposch");

    expect(acc?.proposedSwaps.length).toBe(1);
    const swap = assertNotNull(acc).proposedSwaps[0];
    expect(swap.fromCoin.token).toBe(
      "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
    );
  });
});
