import {
  DaimoLinkNote,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestV2Status,
  TransferClog,
  EAccount,
  OpStatus,
  ProposedSwap,
  guessTimestampFromNum,
  now,
} from "@daimo/common";
import { daimoChainFromId, ForeignToken } from "@daimo/contract";
import assert from "node:assert";
import test from "node:test";
import { Address, Hex, getAddress } from "viem";

import {
  ForeignCoinIndexer,
  ForeignTokenTransfer,
} from "../src/contract/foreignCoinIndexer";
import { HomeCoinIndexer, Transfer } from "../src/contract/homeCoinIndexer";
import { KeyChange, KeyRegistry } from "../src/contract/keyRegistry";
import { NameRegistry } from "../src/contract/nameRegistry";
import { RequestIndexer } from "../src/contract/requestIndexer";
import { chainConfig } from "../src/env";
import { PushNotification, PushNotifier } from "../src/server/pushNotifier";

const addrAlice = getAddress("0x061b0a794945fe0Ff4b764bfB926317f3cFc8b94");
const addrBob = getAddress("0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93");
const addrCharlie = getAddress("0x061b0a794945fe0Ff4b764bfB926317f3cFc8b95");

const notesV2Address = chainConfig.notesV2Address;

test("PushNotifier", async () => {
  const pn = createNotifierAliceBob();

  await test("transfer between two Daimo accounts", async () => {
    const input: Transfer[] = [
      createTransfer({ from: addrAlice, to: addrBob, value: 1000000n }),
    ];
    const output = await pn.getPushNotifsFromTransfers(input);

    assert.strictEqual(output.length, 2);
    assertKey(output[0], addrAlice, `transfer-0x0-0`);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Sent $1.00 to bob");
    assert.strictEqual(push0.body, "You sent 1.00 USDC to bob");

    const push1 = output[1].expoPush;
    assert.deepStrictEqual(push1.to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(push1.title, "Received $1.00 from alice");
    assert.strictEqual(push1.body, "You received 1.00 USDC from alice");
  });

  await test("transfer to external address", async () => {
    const input: Transfer[] = [
      createTransfer({
        from: addrAlice,
        to: addrCharlie,
        value: 690000n,
      }),
    ];
    const output = await pn.getPushNotifsFromTransfers(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Sent $0.69 to charlie.eth");
    assert.strictEqual(push0.body, "You sent 0.69 USDC to charlie.eth");
  });

  await test("transfer fulfilling request", async () => {
    const input: Transfer[] = [
      createTransfer({
        from: addrCharlie,
        to: addrAlice,
        value: 5000000n,
        isRequestResponse: true,
      }),
    ];
    const output = await pn.getPushNotifsFromTransfers(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Received $5.00 from charlie.eth");
    assert.strictEqual(push0.body, "👀");
  });

  await test("transfer with memo", async () => {
    const input: Transfer[] = [
      createTransfer({
        from: addrBob,
        to: addrAlice,
        value: 1000000n,
        memo: true,
      }),
    ];
    const output = await pn.getPushNotifsFromTransfers(input);

    assert.strictEqual(output.length, 2);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(push0.title, "Sent $1.00 to alice");
    assert.strictEqual(push0.body, "hello");

    const push1 = output[1].expoPush;
    assert.deepStrictEqual(push1.to, ["pushTokenAlice"]);
    assert.strictEqual(push1.title, "Received $1.00 from bob");
    assert.strictEqual(push1.body, "hello");
  });

  const paymentLinkFromAlice: DaimoLinkNote = {
    type: "note",
    previewSender: "alice",
    previewDollars: "1.00",
    ephemeralOwner: "0x001234",
  };

  await test("send payment link", async () => {
    const input: DaimoNoteStatus[] = [
      {
        status: DaimoNoteState.Confirmed,
        sender: { addr: addrAlice, name: "alice" },
        dollars: "1.00",
        link: paymentLinkFromAlice,
        contractAddress: notesV2Address,
        ephemeralOwner: "0x001234",
      },
    ];
    const output = pn.getPushNotifsFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Sent $1.00");
    assert.strictEqual(push0.body, "You sent 1.00 USDC to a payment link");
  });

  await test("send payment link with memo", async () => {
    const input: DaimoNoteStatus[] = [
      {
        status: DaimoNoteState.Confirmed,
        sender: { addr: addrAlice, name: "alice" },
        dollars: "1.00",
        link: paymentLinkFromAlice,
        contractAddress: notesV2Address,
        memo: "international dollar",
        ephemeralOwner: "0x001234",
      },
    ];
    const output = pn.getPushNotifsFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    assertKey(output[0], addrAlice, "confirmed-note-0x001234");
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Sent $1.00 · international dollar");
    assert.strictEqual(push0.body, "You sent 1.00 USDC to a payment link");
  });

  await test("claim payment link with memo", async () => {
    const input: DaimoNoteStatus[] = [
      {
        status: DaimoNoteState.Claimed,
        sender: { addr: addrAlice, name: "alice" },
        claimer: { addr: addrBob, name: "bob" },
        dollars: "1.00",
        link: paymentLinkFromAlice,
        contractAddress: notesV2Address,
        memo: "testing 123",
        ephemeralOwner: "0x001234",
      },
    ];
    const output = pn.getPushNotifsFromNoteOps(input);

    assert.strictEqual(output.length, 2);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "$1.00 sent · testing 123");
    assert.strictEqual(push0.body, "bob accepted your 1.00 USDC payment link");
    const push1 = output[1].expoPush;
    assert.deepStrictEqual(push1.to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(push1.title, "Received $1.00 · testing 123");
    assert.strictEqual(push1.body, "You received 1.00 USDC from alice");
  });

  await test("simple remove device", async () => {
    const input: KeyChange[] = [
      createKeyRotation({
        from: addrAlice,
        keySlot: 0,
        isDeploymentLog: true,
        change: "added",
      }),
      createKeyRotation({
        from: addrAlice,
        keySlot: 0,
        isDeploymentLog: false,
        change: "removed",
      }),
    ];
    const output = pn.getPushNotifsFromKeyRotations(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Phone removed");
    assert.strictEqual(push0.body, "You removed Phone from your account");
  });

  await test("complex add/removes", async () => {
    const input: KeyChange[] = [
      createKeyRotation({
        from: addrBob,
        keySlot: 0,
        isDeploymentLog: true,
        change: "added",
      }),
      createKeyRotation({
        from: addrAlice,
        keySlot: 0,
        isDeploymentLog: true,
        change: "added",
      }),
      createKeyRotation({
        from: addrBob,
        keySlot: 128,
        isDeploymentLog: false,
        change: "added",
      }),
      createKeyRotation({
        from: addrBob,
        keySlot: 0,
        isDeploymentLog: false,
        change: "removed",
      }),
      createKeyRotation({
        from: addrBob,
        keySlot: 25,
        isDeploymentLog: false,
        change: "added",
      }),
    ];
    const output = pn.getPushNotifsFromKeyRotations(input);
    assert.strictEqual(output.length, 3);
    for (const n of output) {
      assert.deepStrictEqual(n.expoPush.to, ["pushTokenBob1", "pushTokenBob2"]);
    }

    const [push0, push1, push2] = output.map((o) => o.expoPush);
    assert.strictEqual(push0.title, "Passkey Backup added");
    assert.strictEqual(push0.body, "You added Passkey Backup to your account");
    assert.strictEqual(push1.title, "Phone removed");
    assert.strictEqual(push2.title, "Phone 26 added");
  });

  await test("cancel payment link", async () => {
    const input: DaimoNoteStatus[] = [
      {
        status: DaimoNoteState.Cancelled,
        sender: { addr: addrAlice, name: "alice" },
        claimer: { addr: addrAlice, name: "alice" },
        dollars: "4.20",
        link: paymentLinkFromAlice,
        contractAddress: notesV2Address,
        ephemeralOwner: "0x001234",
      },
    ];
    const output = pn.getPushNotifsFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenAlice"]);
    assert.strictEqual(push0.title, "Reclaimed $4.20");
    assert.strictEqual(push0.body, "You cancelled your 4.20 USDC payment link");
  });

  // TransferSwapClog
  await test("foreign token transfer", async () => {
    const input: ForeignTokenTransfer = createForeignTokenTransfer({
      from: addrCharlie,
      to: addrBob,
      value: 1000000n,
    });
    const output = await pn.getPushNotifsFromForeignCoinTransfer(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(push0.title, "Received 10 FAKE from charlie.eth");
    assert.strictEqual(push0.body, "Accept 10 FAKE as $1.00 USDC");
  });

  // SwapClog
  await test("foreign token inbound swap", async () => {
    const input: Transfer[] = [
      createTransfer({
        from: addrCharlie,
        to: addrBob,
        value: 1000000n,
        isSwap: true,
      }),
    ];
    const output = await pn.getPushNotifsFromTransfers(input);

    assert.strictEqual(output.length, 1);
    const push0 = output[0].expoPush;
    assert.deepStrictEqual(push0.to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(push0.title, "Received $1.00 from charlie.eth");
    assert.strictEqual(push0.body, "You accepted 1.11111 FAKE as $1.00 USDC");
  });
});

// Mock a world with two Daimo accounts, alice and bob
function createNotifierAliceBob() {
  const stubNameReg = {
    getEAccount: async (addr: Address): Promise<EAccount> => {
      if (addr === addrAlice) return { addr, name: "alice" };
      if (addr === addrBob) return { addr, name: "bob" };
      if (addr === addrCharlie) return { addr, ensName: "charlie.eth" };
      throw new Error(`Invalid addr ${addr}`);
    },
  } as unknown as NameRegistry;

  const stubRequestIndexer = {
    getRequestStatusByFulfillLogCoordinate: (
      transactionHash: Hex,
      logIndex: number
    ): DaimoRequestV2Status | null => {
      if (transactionHash === "0x42") {
        return {
          link: {
            type: "requestv2",
            id: "0x42",
            recipient: "bob",
            dollars: "5.00",
          },
          recipient: { addr: addrBob, name: "bob" },
          status: DaimoRequestState.Fulfilled,
          metadata: "0x",
          createdAt: now(),
          memo: "👀",
        };
      } else return null;
    },
  } as unknown as RequestIndexer;

  const stubKeyReg = {
    isDeploymentKeyRotationLog: (log: KeyChange): boolean => {
      return log.transactionHash === "0x42";
    },
  } as unknown as KeyRegistry;

  const stubCoinIndexer = {
    createTransferClog: (log: Transfer, _: Address): TransferClog => {
      const baseClog = {
        status: OpStatus.confirmed,
        timestamp: guessTimestampFromNum(
          Number(log.blockNumber),
          daimoChainFromId(chainConfig.chainL2.id)
        ),
        from: log.from,
        to: log.to,
        amount: Number(log.value),
        blockNumber: Number(log.blockNumber),

        blockHash: log.blockHash,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        memo: log.transactionHash === "0x43" ? "hello" : undefined,
      };

      // Inbound swap (hard-coded txHash)
      if (log.transactionHash === "0x44") {
        return {
          ...baseClog,
          type: "transfer",
          preSwapTransfer: {
            coin: createFakeForeignToken(),
            amount: "111111",
            from: log.from,
          },
        } as TransferClog;
      } else {
        // TransferSwapClog
        return {
          ...baseClog,
          type: "transfer",
          requestStatus:
            stubRequestIndexer.getRequestStatusByFulfillLogCoordinate(
              log.transactionHash,
              log.logIndex - 1
            ) || undefined,
        } as TransferClog;
      }
    },
  } as unknown as HomeCoinIndexer;

  const stubForeignCoinIndexer = {
    getProposedSwapForLog: (log: Transfer): ProposedSwap | undefined => {
      if (log.transactionHash === "0x44") {
        return {
          fromCoin: createFakeForeignToken(),
          fromAmount: "111111",
          fromAcc: { addr: addrCharlie, ensName: "charlie.eth" },
          receivedAt: now(),
          toCoin: chainConfig.tokenAddress,
          routeFound: true,
          toAmount: 1000000,
          cacheUntil: now() + 5 * 60,
          execDeadline: now() + 10 * 60,
          execRouterAddress: "0x0",
          execCallData: "0x0",
          execValue: "0x0",
        };
      }
    },

    getForeignTokenReceiveForSwap: (addr: Address, txHash: Hex) => {
      if (txHash === "0x44") {
        return createForeignTokenTransfer({
          from: addrCharlie,
          to: addrBob,
          value: 1000000n,
        });
      }
    },

    attachTransferOpProperties: (log: Transfer): TransferClog => {
      const op: TransferClog = {
        type: "transfer",
        status: OpStatus.confirmed,
        timestamp: guessTimestampFromNum(
          Number(log.blockNumber),
          daimoChainFromId(chainConfig.chainL2.id)
        ),
        from: log.from,
        to: log.to,
        amount: Number(log.value),
        blockNumber: Number(log.blockNumber),

        blockHash: log.blockHash,
        txHash: log.transactionHash,
        logIndex: log.logIndex,

        preSwapTransfer: {
          coin: createFakeForeignToken(),
          amount: "1000000" as `${bigint}`,
          from: log.from,
        },
      };
      return op;
    },
  } as unknown as ForeignCoinIndexer;

  const nullAny = null as any;
  const pn = new PushNotifier(
    stubCoinIndexer,
    stubForeignCoinIndexer,
    stubNameReg,
    nullAny,
    stubRequestIndexer,
    stubKeyReg,
    nullAny
  );
  pn.pushTokens.set(addrAlice, ["pushTokenAlice"]);
  pn.pushTokens.set(addrBob, ["pushTokenBob1", "pushTokenBob2"]);

  return pn;
}

function createTransfer(args: {
  from: Address;
  to: Address;
  value: bigint;
  memo?: boolean;
  isRequestResponse?: boolean;
  isSwap?: boolean;
}): Transfer {
  // hardcoded txHash used in stub classes
  const txHash = args.isRequestResponse
    ? "0x42"
    : args.memo
    ? "0x43"
    : args.isSwap
    ? "0x44"
    : "0x0";

  return {
    address: "0x0",
    blockHash: "0x0",
    blockNumber: 0n,
    transactionHash: txHash,
    transactionIndex: 0,
    logIndex: 0,
    from: args.from,
    to: args.to,
    value: args.value,
  };
}

function createForeignTokenTransfer(args: {
  from: Address;
  to: Address;
  value: bigint;
}): ForeignTokenTransfer {
  return {
    address: "0x0",
    blockHash: "0x0",
    blockNumber: 0n,
    transactionHash: "0x44",
    transactionIndex: 0,
    logIndex: 0,
    from: args.from,
    to: args.to,
    value: args.value,
    foreignToken: createFakeForeignToken(),
  };
}

function createFakeForeignToken(): ForeignToken {
  return {
    token: "0x0",
    name: "fake token",
    symbol: "FAKE",
    decimals: 5,
    chainId: chainConfig.chainL2.id,
  };
}

function createKeyRotation(args: {
  from: Address;
  keySlot: number;
  isDeploymentLog: boolean;
  change: "added" | "removed";
}): KeyChange {
  return {
    change: args.change,
    address: args.from,
    blockNumber: 0n,
    transactionIndex: 0,
    transactionHash: args.isDeploymentLog ? "0x42" : "0x0",
    logIndex: 0,
    keySlot: args.keySlot,
    key: ["0x0", "0x0"],
  };
}

function assertKey(pn: PushNotification, addr: Address, key: string) {
  assert.strictEqual(pn.address, addr);
  assert.strictEqual(pn.key, key);
}
