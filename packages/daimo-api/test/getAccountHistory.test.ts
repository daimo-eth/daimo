import {
  LandlineTransfer,
  LandlineTransferStatus,
  LandlineTransferType,
  OpStatus,
  TransferClog,
} from "@daimo/common";
import assert from "node:assert";
import test from "tape";

import { addLandlineTransfers } from "../src/landline/landlineClogMatcher";

test("addLandlineTransfers", (t) => {
  test("should match landline transfer to transfer clog", (t) => {
    // Create two on-chain transfer clogs
    const transferClogs: TransferClog[] = [
      {
        type: "transfer",
        from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
        to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
        amount: 1000000,
        timestamp: 1234567890,
        status: OpStatus.confirmed,
        // txHash matches the landline transfer
        txHash:
          "0x1d6e083a6009de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
      },
      {
        type: "transfer",
        from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
        to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
        amount: 1230000,
        timestamp: 1234567899,
        status: OpStatus.confirmed,
        txHash:
          "0x111111111109de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
      },
    ];

    const landlineTransfers: LandlineTransfer[] = [
      {
        daimoAddress: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
        transferUuid: "asdf-asdf-asdf-asdf",
        landlineAccountUuid: "fdsa-fdsa-fdsa-fdsa",

        bankName: "Chase",
        bankLogo: null,
        accountName: "checking",
        accountType: null,
        accountNumberLastFour: "1234",
        bankCurrency: "usd",
        liquidationAddress: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",

        fromAddress: null,
        fromChain: null,
        toAddress: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
        toChain: "base",

        type: LandlineTransferType.Deposit,
        amount: "1.0",
        memo: "test deposit",

        // txHash matches the first transfer clog
        txHash:
          "0x1d6e083a6009de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
        status: LandlineTransferStatus.Completed,
        statusMessage: "transfer completed",

        createdAt: new Date("2024-01-01T00:00:00Z").getTime(),
        estimatedClearingDate: new Date("2024-01-02T00:00:00Z").getTime(),
        completedAt: new Date("2024-01-02T00:00:00Z").getTime(),
      },
    ];

    const result = addLandlineTransfers(
      landlineTransfers,
      transferClogs,
      "base"
    );

    assert.strictEqual(result.length, 2);
    // The second transfer clog should be unmodified, since it didn't match
    assert.deepStrictEqual(result[1], transferClogs[1]);

    // The first transfer clog should be merged with the landline transfer
    const expectedTransferClog = {
      type: "transfer",
      from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
      to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
      amount: 1000000,
      timestamp: 1234567890,
      status: "confirmed",
      memo: "test deposit",
      txHash:
        "0x1d6e083a6009de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
      offchainTransfer: {
        type: "landline",
        transferType: "deposit",
        status: "completed",
        statusMessage: "transfer completed",
        accountID: "fdsa-fdsa-fdsa-fdsa",
        transferID: "asdf-asdf-asdf-asdf",
        timeStart: 1704067200,
        timeExpected: 1704153600,
        timeFinish: 1704153600,
      },
    };
    assert.deepStrictEqual(result[0], expectedTransferClog);

    t.end();
  });

  t.test(
    "landlineTransfers should not get matched if txHash does not match",
    (t) => {
      // Create two on-chain transfer clogs which don't match any landline transfer
      const transferClogs: TransferClog[] = [
        {
          type: "transfer",
          from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
          to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
          amount: 1000000,
          timestamp: 1234567890,
          status: OpStatus.confirmed,
          txHash:
            "0x1d6e083a6009de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
        },
        {
          type: "transfer",
          from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
          to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
          amount: 1230000,
          timestamp: 1234567899,
          status: OpStatus.confirmed,
          txHash:
            "0x111111111109de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
        },
      ];

      // Create two landline transfers which don't match any transfer clog
      const landlineTransfers: LandlineTransfer[] = [
        {
          daimoAddress: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
          transferUuid: "asdf-asdf-asdf-asdf",
          landlineAccountUuid: "fdsa-fdsa-fdsa-fdsa",

          bankName: "Chase",
          bankLogo: null,
          accountName: "checking",
          accountType: null,
          accountNumberLastFour: "1234",
          bankCurrency: "usd",
          liquidationAddress: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",

          fromAddress: null,
          fromChain: null,
          toAddress: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
          toChain: "base",

          type: LandlineTransferType.Deposit,
          amount: "1.0",
          memo: "test deposit",

          // no tx hash
          txHash: null,
          status: LandlineTransferStatus.Processing,
          statusMessage: "processing deposit",

          createdAt: new Date("2024-01-01T00:00:00Z").getTime(),
          estimatedClearingDate: new Date("2024-01-02T00:00:00Z").getTime(),
          completedAt: new Date("2024-01-02T00:00:00Z").getTime(),
        },
        {
          daimoAddress: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
          transferUuid: "asdf-asdf-asdf-1111",
          landlineAccountUuid: "fdsa-fdsa-fdsa-fdsa",

          bankName: "Chase",
          bankLogo: null,
          accountName: "checking",
          accountType: null,
          accountNumberLastFour: "1234",
          bankCurrency: "usd",
          liquidationAddress: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",

          fromAddress: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
          fromChain: "base",
          toAddress: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
          toChain: "base",

          type: LandlineTransferType.Withdrawal,
          amount: "1.0",
          memo: null,

          // tx hash does not match any transfer clog
          txHash:
            "0x222222222209de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
          status: LandlineTransferStatus.Processing,
          statusMessage: "processing withdrawal",

          createdAt: new Date("2024-02-01T00:00:00Z").getTime(),
          estimatedClearingDate: new Date("2024-02-03T00:00:00Z").getTime(),
          completedAt: new Date("2024-02-03T00:00:00Z").getTime(),
        },
      ];

      const result = addLandlineTransfers(
        landlineTransfers,
        transferClogs,
        "base"
      );

      // The two on-chain transfer clogs and two landline transfers should all
      // be included in the result
      assert.strictEqual(result.length, 4);
      assert.deepStrictEqual(result[0], transferClogs[0]);
      assert.deepStrictEqual(result[1], transferClogs[1]);

      const expectedDepositClog = {
        timestamp: 1704067200,
        status: "confirmed",
        txHash: undefined,
        blockNumber: 8638926,
        logIndex: 0,
        type: "transfer",
        from: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
        to: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
        amount: 1000000,
        memo: "test deposit",
        offchainTransfer: {
          type: "landline",
          transferType: "deposit",
          status: "processing",
          statusMessage: "processing deposit",
          accountID: "fdsa-fdsa-fdsa-fdsa",
          transferID: "asdf-asdf-asdf-asdf",
          timeStart: 1704067200,
          timeExpected: 1704153600,
          timeFinish: 1704153600,
        },
      };
      const expectedWithdrawalClog = {
        timestamp: 1706745600,
        status: "pending",
        txHash:
          "0x222222222209de3dc3672f2dd799e52604d819c5b98e3beb77c50ec259630060",
        blockNumber: 9978126,
        logIndex: 0,
        type: "transfer",
        from: "0x6af35dF65594398726140cf1bf0339e94c7A817F",
        to: "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87",
        amount: 1000000,
        memo: undefined,
        offchainTransfer: {
          type: "landline",
          transferType: "withdrawal",
          status: "processing",
          statusMessage: "processing withdrawal",
          accountID: "fdsa-fdsa-fdsa-fdsa",
          transferID: "asdf-asdf-asdf-1111",
          timeStart: 1706745600,
          timeExpected: 1706918400,
          timeFinish: 1706918400,
        },
      };

      assert.deepStrictEqual(result[2], expectedDepositClog);
      assert.deepStrictEqual(result[3], expectedWithdrawalClog);

      t.end();
    }
  );

  t.end();
});
