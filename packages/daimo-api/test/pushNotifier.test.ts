import { EAccount } from "@daimo/common";
import assert from "node:assert";
import test from "node:test";
import { Address } from "viem";

import { TransferLog } from "../src/contract/coinIndexer";
import { NameRegistry } from "../src/contract/nameRegistry";
import { NoteOpLog } from "../src/contract/noteIndexer";
import { PushNotifier } from "../src/pushNotifier";

const addrAlice = "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b94";
const addrBob = "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93";
const addrCharlie = "0x061b0a794945fe0Ff4b764bfB926317f3cFc8b95";

test("PushNotifier", async () => {
  const pn = createNotifierAliceBob();

  await test("transfer between two Daimo accounts", async () => {
    const input: TransferLog[] = [
      createTransferLog({ from: addrAlice, to: addrBob, value: 1000000n }),
    ];
    const output = await pn.getPushMessagesFromTransfers(input);

    assert.strictEqual(output.length, 2);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Sent $1.00");
    assert.strictEqual(output[0].body, "You sent 1.00 USDC to bob");

    assert.deepStrictEqual(output[1].to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(output[1].title, "Received $1.00");
    assert.strictEqual(output[1].body, "You received 1.00 USDC from alice");
  });

  await test("transfer to external address", async () => {
    const input: TransferLog[] = [
      createTransferLog({ from: addrAlice, to: addrCharlie, value: 690000n }),
    ];
    const output = await pn.getPushMessagesFromTransfers(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Sent $0.69");
    assert.strictEqual(output[0].body, "You sent 0.69 USDC to charlie.eth");
  });

  await test("send payment link", async () => {
    const input: NoteOpLog[] = [
      {
        type: "create",
        noteStatus: {
          status: "pending",
          sender: { addr: addrAlice, name: "alice" },
          dollars: "1.00",
          link: { type: "note", ephemeralOwner: "0x0" },
        },
      },
    ];
    const output = pn.getPushMessagesFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "Sent $1.00");
    assert.strictEqual(output[0].body, "You sent 1.00 USDC to a payment link");
  });

  await test("claim payment link", async () => {
    const input: NoteOpLog[] = [
      {
        type: "claim",
        noteStatus: {
          status: "claimed",
          sender: { addr: addrAlice, name: "alice" },
          claimer: { addr: addrBob, name: "bob" },
          dollars: "1.00",
          link: { type: "note", ephemeralOwner: "0x0" },
        },
      },
    ];
    const output = pn.getPushMessagesFromNoteOps(input);

    assert.strictEqual(output.length, 2);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "$1.00 claimed");
    assert.strictEqual(
      output[0].body,
      "bob claimed your 1.00 USDC payment link"
    );
    assert.deepStrictEqual(output[1].to, ["pushTokenBob1", "pushTokenBob2"]);
    assert.strictEqual(output[1].title, "Received $1.00");
    assert.strictEqual(output[1].body, "You received 1.00 USDC from alice");
  });

  await test("cancel payment link", async () => {
    const input: NoteOpLog[] = [
      {
        type: "claim",
        noteStatus: {
          status: "cancelled",
          sender: { addr: addrAlice, name: "alice" },
          claimer: { addr: addrAlice, name: "alice" },
          dollars: "4.20",
          link: { type: "note", ephemeralOwner: "0x0" },
        },
      },
    ];
    const output = pn.getPushMessagesFromNoteOps(input);

    assert.strictEqual(output.length, 1);
    assert.deepStrictEqual(output[0].to, ["pushTokenAlice"]);
    assert.strictEqual(output[0].title, "$4.20 claimed");
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
  const nullAny = null as any;
  const pn = new PushNotifier(nullAny, stubNameReg, nullAny, nullAny, nullAny);
  pn.pushTokens.set(addrAlice, ["pushTokenAlice"]);
  pn.pushTokens.set(addrBob, ["pushTokenBob1", "pushTokenBob2"]);

  return pn;
}

function createTransferLog(args: {
  from: Address;
  to: Address;
  value: bigint;
}): TransferLog {
  return {
    eventName: "Transfer",
    args,
    address: "0x0",
    blockHash: "0x0",
    blockNumber: 0n,
    data: "0x0",
    logIndex: 0,
    removed: false,
    topics: ["0x0", "0x0", "0x0"],
    transactionHash: "0x0",
    transactionIndex: 0,
  };
}
