import { EAccount } from "@daimo/common";
import assert from "node:assert";
import test from "node:test";
import { Client, Pool } from "pg";
import { Address } from "viem";

import { KeyRegistry } from "../src/contract/keyRegistry";
import { NoteIndexer } from "../src/contract/noteIndexer";
import { ViemClient } from "../src/network/viemClient";

interface TestPG {
  pool: Pool;
  done: () => Promise<void>;
}

async function testPG(schema: string): Promise<TestPG> {
  const ctrldb = new Client({ connectionString: "postgres:///postgres" });
  await ctrldb.connect();
  const name = `daimo_test_${Math.random().toString(16).slice(2, 10)}`;
  await ctrldb.query(`create database ${name}`);
  await ctrldb.end();

  const testdb = new Pool({ connectionString: `postgres:///${name}` });
  await testdb.query(schema);
  return {
    pool: testdb,
    done: async () => {
      await testdb.end();
      const ctrldb = new Client({ connectionString: "postgres:///postgres" });
      await ctrldb.connect();
      await ctrldb.query(`drop database ${name}`);
      await ctrldb.end();
      console.log("testdb done");
    },
  };
}
const schema = `
    create table note_created(
        chain_id numeric,
        block_num numeric,
        block_hash bytea,
        block_time numeric,
        tx_idx numeric,
        tx_hash bytea,
        log_addr bytea,
        ephemeral_owner bytea,
        f bytea,
        amount numeric,
        ig_name text,
        src_name text,
        log_idx smallint,
        abi_idx smallint
    );
    insert into note_created(block_num, amount) values (10, 100);

    create table key_added(
      chain_id numeric,
      block_num numeric,
      block_hash bytea,
      block_time numeric,
      tx_idx numeric,
      tx_hash bytea,
      log_addr bytea,
      ig_name text,
      src_name text,
      log_idx smallint,
      abi_idx smallint,

      key bytea,
      key_slot smallint,
      account bytea
  );
  insert into key_added(block_num, key_slot, key) values (10, 1, '\x2a');
  insert into key_added(block_num, key_slot, key) values (10, 1, '\x2b');
`;

const testNameResolver = (address: Address): Promise<EAccount> => {
  return Promise.resolve({ addr: address, name: "test" });
};

test("note indexer", async () => {
  const pg = await testPG(schema);
  test.after(async () => await pg.done());

  const indexer = new NoteIndexer(testNameResolver);
  const got = await indexer["loadCreated"](pg.pool, 0n, 100n);
  const want = {
    dollars: "0.00",
    link: {
      ephemeralOwner: null,
      previewDollars: "0.00",
      previewSender: "test",
      type: "note",
    },
    sender: {
      addr: null,
      name: "test",
    },
    status: "confirmed",
  };
  assert.deepEqual(got[0], want);
});

test("key registry", async () => {
  const pg = await testPG(schema);
  test.after(async () => await pg.done());

  const kr = new KeyRegistry({} as unknown as ViemClient);
  const got = await kr["loadKeyChange"](pg.pool, 0n, 100n, "added");
  const want = {
    blockNumber: 10n,
    blockHash: null,
    transactionHash: null,
    transactionIndex: null,
    logIndex: null,
    address: null,
    change: "added",
    account: null,
    keySlot: 1,
    key: [`0x2a`, `0x2b`],
  };
  assert.deepEqual(got[0], want);
});
