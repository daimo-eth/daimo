import {
  DaimoLinkNote,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestV2Status,
  DisplayOpEvent,
  EAccount,
  OpStatus,
  guessTimestampFromNum,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import assert from "node:assert";
import test from "node:test";
import { Address, Hex, getAddress } from "viem";

import { CoinIndexer, Transfer } from "../src/contract/coinIndexer";
import { KeyChange, KeyRegistry } from "../src/contract/keyRegistry";
import { NameRegistry } from "../src/contract/nameRegistry";
import { RequestIndexer } from "../src/contract/requestIndexer";
import { chainConfig } from "../src/env";
import { PushNotifier } from "../src/server/pushNotifier";

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
    const output = await pn.getPushMessagesFromTransfers(input);

    assert.strictEqual(output.length, 2);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Sent $1.00 to bob");
    assert.strictEqual(output[0].body, "You sent 1.00 USDC to bob");

    assert.deepStrictEqual(output[1].to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(output[1].title, "Received $1.00 from alice");
    assert.strictEqual(output[1].body, "You received 1.00 USDC from alice");
  });

  await test("transfer to external address", async () => {
    const input: Transfer[] = [
      createTransfer({ from: addrAlice, to: addrCharlie, value: 690000n }),
    ];
    const output = await pn.getPushMessagesFromTransfers(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Sent $0.69 to charlie.eth");
    assert.strictEqual(output[0].body, "You sent 0.69 USDC to charlie.eth");
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
    const output = await pn.getPushMessagesFromTransfers(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Received $5.00 from charlie.eth");
    assert.strictEqual(output[0].body, "Your 5.00 USDC request was fulfilled");
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
    const output = await pn.getPushMessagesFromTransfers(input);

    assert.strictEqual(output.length, 2);
    assert.deepStrictEqual(output[0].to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(output[0].title, "Sent $1.00 to alice");
    assert.strictEqual(output[0].body, "hello");

    assert.deepStrictEqual(output[1].to, ["pushTokenAlice"]);
    assert.strictEqual(output[1].title, "Received $1.00 from bob");
    assert.strictEqual(output[1].body, "hello");
  });

  const paymentLinkFromAlice: DaimoLinkNote = {
    type: "note",
    previewSender: "alice",
    previewDollars: "1.00",
    ephemeralOwner: "0x0",
  };

  await test("send payment link", async () => {
    const input: DaimoNoteStatus[] = [
      {
        status: DaimoNoteState.Confirmed,
        sender: { addr: addrAlice, name: "alice" },
        dollars: "1.00",
        link: paymentLinkFromAlice,
        contractAddress: notesV2Address,
      },
    ];
    const output = pn.getPushMessagesFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Sent $1.00");
    assert.strictEqual(output[0].body, "You sent 1.00 USDC to a payment link");
  });

  await test("claim payment link", async () => {
    const input: DaimoNoteStatus[] = [
      {
        status: DaimoNoteState.Claimed,
        sender: { addr: addrAlice, name: "alice" },
        claimer: { addr: addrBob, name: "bob" },
        dollars: "1.00",
        link: paymentLinkFromAlice,
        contractAddress: notesV2Address,
      },
    ];
    const output = pn.getPushMessagesFromNoteOps(input);

    assert.strictEqual(output.length, 2);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "$1.00 sent");
    assert.strictEqual(
      output[0].body,
      "bob accepted your 1.00 USDC payment link"
    );
    assert.deepStrictEqual(output[1].to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(output[1].title, "Received $1.00");
    assert.strictEqual(output[1].body, "You received 1.00 USDC from alice");
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
    const output = pn.getPushMessagesFromKeyRotations(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Phone removed");
    assert.strictEqual(output[0].body, "You removed Phone from your account");
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
    const output = pn.getPushMessagesFromKeyRotations(input);
    assert.strictEqual(output.length, 3);
    for (const msg of output) {
      assert.deepStrictEqual(msg.to, ["pushTokenBob1", "pushTokenBob2"]);
    }
    assert.strictEqual(output[0].title, "Passkey Backup added");
    assert.strictEqual(
      output[0].body,
      "You added Passkey Backup to your account"
    );
    assert.strictEqual(output[1].title, "Phone removed");
    assert.strictEqual(output[2].title, "Phone 26 added");
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
      },
    ];
    const output = pn.getPushMessagesFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Reclaimed $4.20");
    assert.strictEqual(
      output[0].body,
      "You cancelled your 4.20 USDC payment link"
    );
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
    attachTransferOpProperties: (log: Transfer): DisplayOpEvent => {
      const op: DisplayOpEvent = {
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
        requestStatus:
          stubRequestIndexer.getRequestStatusByFulfillLogCoordinate(
            log.transactionHash,
            log.logIndex - 1
          ) || undefined,
        memo: log.transactionHash === "0x43" ? "hello" : undefined,
      };
      return op;
    },
  } as unknown as CoinIndexer;

  const nullAny = null as any;
  const pn = new PushNotifier(
    stubCoinIndexer,
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
}): Transfer {
  // hardcoded txHash used in stub classes
  const txHash = args.isRequestResponse ? "0x42" : args.memo ? "0x43" : "0x0";

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
    account: args.from,
    keySlot: args.keySlot,
    key: ["0x0", "0x0"],
  };
}
