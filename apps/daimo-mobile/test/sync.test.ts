import { OpStatus, TransferClog, TransferSwapClog } from "@daimo/common";

import { addLandlineTransfers } from "../src/sync/syncLandline";

describe("addLandlineTransfers", () => {
  it("adds a new landline deposit clog when there are no existing clogs", () => {
    const oldLogs: TransferClog[] = [];
    const newLandlineClog: TransferSwapClog = {
      type: "transfer",
      from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
      to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
      amount: 1000000,
      timestamp: 1234567890,
      status: OpStatus.confirmed,
      offchainTransfer: {
        type: "landline",
        transferType: "deposit",
        status: "processing",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567890,
      },
    };

    const result = addLandlineTransfers(oldLogs, [newLandlineClog]);

    expect(result.logs).toEqual([newLandlineClog]);
    expect(result.remaining).toEqual([]);
  });

  it("replaces an existing landline deposit clog with a new one", () => {
    const oldLandlineClog: TransferSwapClog = {
      type: "transfer",
      from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
      to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
      amount: 1000000,
      timestamp: 1234567890,
      status: OpStatus.confirmed,
      offchainTransfer: {
        type: "landline",
        transferType: "deposit",
        status: "processing",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567890,
      },
    };

    const newLandlineClog: TransferSwapClog = {
      ...oldLandlineClog,
      status: OpStatus.failed,
      offchainTransfer: {
        type: "landline",
        transferType: "deposit",
        status: "failed",
        statusMessage: "Failed to deposit",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567890,
        timeExpected: 1234569999,
      },
    };

    const result = addLandlineTransfers([oldLandlineClog], [newLandlineClog]);

    expect(result.logs).toEqual([newLandlineClog]);
    expect(result.remaining).toEqual([]);
  });

  it("merges a transfer clog and an old landline clog with a new landline clog", () => {
    const oldTransferClog: TransferSwapClog = {
      type: "transfer",
      from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
      to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
      amount: 1000000,
      timestamp: 1234570000,
      status: OpStatus.confirmed,
      txHash:
        "0x1d6e083a6009de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
    };

    const oldLandlineClog: TransferSwapClog = {
      type: "transfer",
      from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
      to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
      amount: 1000000,
      timestamp: 1234567890,
      status: OpStatus.confirmed,
      offchainTransfer: {
        type: "landline",
        transferType: "deposit",
        status: "processing",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567890,
      },
    };

    const newLandlineClog: TransferSwapClog = {
      ...oldLandlineClog,
      status: OpStatus.confirmed,
      txHash:
        "0x1d6e083a6009de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
      offchainTransfer: {
        type: "landline",
        transferType: "deposit",
        status: "completed",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567890,
        timeExpected: 1234569999,
        timeFinish: 1234570000,
      },
    };

    const result = addLandlineTransfers(
      [oldTransferClog, oldLandlineClog],
      [newLandlineClog]
    );

    // The on-chain part of the old transfer should be combined with the
    // updated offchain part of the new landline clog
    const expectedLog: TransferSwapClog = {
      ...oldTransferClog,
      offchainTransfer: newLandlineClog.offchainTransfer,
    };
    expect(result.logs).toEqual([expectedLog]);
    expect(result.remaining).toEqual([]);
  });

  it("merges a new landline withdrawal clog with an old transfer clog", () => {
    const oldTransferClog: TransferSwapClog = {
      type: "transfer",
      from: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      to: "0xf8736A44a2420d856d28B9B2f8374973755CcdB5",
      amount: 1230000,
      timestamp: 1234567890,
      status: OpStatus.confirmed,
      txHash:
        "0x95c66cac0607b2c076f85b935d8b4df801ecf15bcb6d9f58afc324d132e6b8b0",
    };

    const newLandlineClog: TransferSwapClog = {
      type: "transfer",
      from: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      to: "0xf8736A44a2420d856d28B9B2f8374973755CcdB5",
      amount: 1230000,
      timestamp: 1234567999,
      status: OpStatus.confirmed,
      txHash:
        "0x95c66cac0607b2c076f85b935d8b4df801ecf15bcb6d9f58afc324d132e6b8b0",
      offchainTransfer: {
        type: "landline",
        transferType: "withdrawal",
        status: "processing",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567999,
      },
    };

    const result = addLandlineTransfers([oldTransferClog], [newLandlineClog]);
    console.log(result.logs);

    // The on-chain part of the old transfer should be combined with the
    // updated offchain part of the new landline clog
    const expectedLog: TransferSwapClog = {
      ...oldTransferClog,
      offchainTransfer: newLandlineClog.offchainTransfer,
    };
    expect(result.logs).toEqual([expectedLog]);
    expect(result.remaining).toEqual([]);
  });

  it("merges a new landline withdrawal clog with an old landline clog", () => {
    const oldLandlineClog: TransferSwapClog = {
      type: "transfer",
      from: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      to: "0xf8736A44a2420d856d28B9B2f8374973755CcdB5",
      amount: 1230000,
      timestamp: 1234567890,
      status: OpStatus.confirmed,
      txHash:
        "0x95c66cac0607b2c076f85b935d8b4df801ecf15bcb6d9f58afc324d132e6b8b0",
      offchainTransfer: {
        type: "landline",
        transferType: "withdrawal",
        status: "processing",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567999,
      },
    };

    const newLandlineClog: TransferSwapClog = {
      type: "transfer",
      from: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      to: "0xf8736A44a2420d856d28B9B2f8374973755CcdB5",
      amount: 1230000,
      timestamp: 1234570000,
      status: OpStatus.confirmed,
      txHash:
        "0x95c66cac0607b2c076f85b935d8b4df801ecf15bcb6d9f58afc324d132e6b8b0",
      offchainTransfer: {
        type: "landline",
        transferType: "withdrawal",
        status: "completed",
        accountID: "asdf-asdf-asdf-asdf-asdf",
        timeStart: 1234567999,
        timeExpected: 1234569999,
        timeFinish: 1234570000,
      },
    };

    const result = addLandlineTransfers([oldLandlineClog], [newLandlineClog]);

    // The on-chain part of the old transfer should be combined with the
    // updated offchain part of the new landline clog
    const expectedLog: TransferSwapClog = {
      ...oldLandlineClog,
      offchainTransfer: newLandlineClog.offchainTransfer,
    };
    expect(result.logs).toEqual([expectedLog]);
    expect(result.remaining).toEqual([]);
  });
});
