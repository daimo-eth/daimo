import { guessTimestampFromNum, now, retryBackoff } from "@daimo/common";
import { Kysely, PostgresDialect } from "kysely";
import { ClientConfig, Pool, PoolConfig } from "pg";
import { PublicClient } from "viem";

import { DBNotifier, DB_EVENT_NEW_BLOCK } from "./dbNotifier";
import { DB as IndexDB } from "../codegen/dbIndex";
import { Indexer } from "../contract/indexer";
import { chainConfig } from "../env";

function getIndexDBConfig(dbUrl?: string) {
  const dbConfig: ClientConfig = {
    connectionString: dbUrl,
    connectionTimeoutMillis: 20000,
    query_timeout: 20000,
    statement_timeout: 20000,
    database: dbUrl == null ? "index" : undefined,
  };

  const poolConfig: PoolConfig = {
    ...dbConfig,
    min: 1,
    max: 8,
    idleTimeoutMillis: 60000,
  };

  return { poolConfig, dbConfig };
}

export class IndexWatcher {
  readonly notifications: DBNotifier;

  // Start from a block before the first Daimo tx on Base and Base Sepolia.
  private latest;
  private batchSize = 1000_000;
  private isIndexing = false;

  // The latest block through which our DB index is up to date.
  private indexLatest = 0;
  // The latest block as reported directly by the RPC
  private rpcLatest = 0;
  // The latest successful tick.
  private lastGoodTickS = 0;

  // indexers by dependency layers.
  // indexers[0] are indexed first concurrently, indexers[1] second, etc.
  private indexerLayers: Indexer[][] = [];

  public readonly pg: Pool;
  public readonly kdb: Kysely<IndexDB>;

  constructor(private rpcClient: PublicClient, dbUrl?: string) {
    const { poolConfig, dbConfig } = getIndexDBConfig(dbUrl);
    this.pg = new Pool(poolConfig);
    this.kdb = new Kysely<IndexDB>({
      dialect: new PostgresDialect({ pool: this.pg }),
    });
    this.notifications = new DBNotifier(dbConfig);

    this.latest = 5700000 - 1;
  }

  add(...i: Indexer[][]) {
    this.indexerLayers.push(...i);
  }

  latestBlock(): { number: number; timestamp: number } {
    return {
      number: this.latest,
      timestamp: guessTimestampFromNum(this.latest, chainConfig.daimoChain),
    };
  }

  async waitFor(blockNumber: number, tries: number): Promise<boolean> {
    const t0 = Date.now();
    let tS;
    for (let i = 0; i < tries; i++) {
      if (this.latest >= blockNumber) {
        tS = (Date.now() - t0) | 0;
        console.log(
          `[WATCHER] waiting for block ${blockNumber}, found after ${tS}ms`
        );
        return true;
      }
      await new Promise((res) => setTimeout(res, 250));
    }
    tS = (Date.now() - t0) | 0;
    console.log(
      `[WATCHER] waiting for block ${blockNumber}, NOT FOUND, still on ${this.latest} after ${tS}ms`
    );
    return false;
  }

  async init() {
    this.indexLatest = await this.getIndexLatest();
    await this.catchUpTo(this.indexLatest);
  }

  // Watches IndexDB for new blocks, loads into in-memory index.
  async watch() {
    this.notifications.on(DB_EVENT_NEW_BLOCK, async () =>
      this.tick("tick-db-notify")
    );

    // DB notifications unreliable. Backup tick.
    setInterval(() => this.tick("tick-interval"), 1000);
  }

  async tick(tickName: string) {
    try {
      if (this.isIndexing) {
        console.log(`[WATCHER] skipping ${tickName}, already indexing`);
        return;
      }
      this.isIndexing = true;

      // Get tip block number
      const res = await Promise.all([
        this.getIndexLatest(),
        this.rpcClient.getBlockNumber(),
      ]);
      this.indexLatest = res[0];
      this.rpcLatest = Number(res[1]);
      if (this.indexLatest <= this.latest) {
        console.log(`[WATCHER] skipping ${tickName}, no new blocks`);
        return;
      }

      // New block(s) available. Index them.
      const { rpcLatest, latest, indexLatest, batchSize } = this;
      const newLatest = await this.index(latest + 1, indexLatest, batchSize);

      const dbg = JSON.stringify({ rpcLatest, indexLatest, latest, newLatest });
      console.log(`[WATCHER] ${tickName} success ${dbg}`);
      this.latest = newLatest;
      this.lastGoodTickS = now();
    } catch (e) {
      console.error(`[WATCHER] ${tickName} error`, e);
    } finally {
      this.isIndexing = false;
    }
  }

  // Indexes batches till we get to the given block number, inclusive.
  async catchUpTo(stop: number) {
    while (this.latest < stop) {
      this.latest = await this.index(this.latest + 1, stop, this.batchSize);
    }
    console.log(`[WATCHER] initialized to ${this.latest}`);
  }

  // Indexes a single batch of blocks.
  // Returns new tip block number on success, 0 if stop<start (= no new blocks).
  private async index(start: number, stop: number, n: number): Promise<number> {
    const t0 = Date.now();
    const delta = stop - start;
    if (delta < 0) return 0;
    const limit = delta >= n ? n - 1 : delta;
    console.log(`[WATCHER] loading ${start} to ${start + limit}`);
    for (const [, layer] of this.indexerLayers.entries()) {
      await Promise.all(
        layer.map((i) => i.load(this.kdb, start, start + limit))
      );
    }
    console.log(
      `[WATCHER] loaded ${start} to ${start + limit} in ${Date.now() - t0}ms`
    );
    return start + limit;
  }

  async getIndexLatest(): Promise<number> {
    const result = await retryBackoff(`index-latest-query`, () =>
      this.kdb
        .selectFrom("index.daimo_index")
        .select(["latest_block_num"])
        .where("chain_id", "=", "" + chainConfig.chainL2.id)
        .executeTakeFirst()
    );
    return Number(result?.latest_block_num || 0);
  }

  // Get the block write to postgres latency over the last numBlocks
  async getLatency() {
    // Get the block times and latencies for the last 1000 blocks
    const blockTimes = await retryBackoff(`get-block-db-latency`, () =>
      this.kdb
        .selectFrom("index.daimo_block")
        .select(["timestamp", "inserted_at"])
        .where("chain_id", "=", "" + chainConfig.chainL2.id)
        .where("inserted_at", "is not", null)
        .orderBy("number", "desc") // Primary key scan: (chain_id, number)
        .limit(100)
        .execute()
    );
    if (blockTimes.length === 0) return {};

    const latencies = blockTimes.map((blockTime) =>
      Math.abs(
        Number(BigInt(blockTime.timestamp) - BigInt(blockTime.inserted_at!))
      )
    );

    // Latency stats
    const avgLatency =
      latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);
    return {
      avgLatency,
      maxLatency,
      minLatency,
    };
  }

  getStatus() {
    const { lastGoodTickS, indexLatest, rpcLatest } = this;
    const { idleCount, totalCount, waitingCount } = this.pg;
    return {
      lastGoodTickS,
      rpcLatest,
      indexLatest,
      indexDB: {
        idleCount,
        totalCount,
        waitingCount,
      },
    };
  }

  async migrateDB() {
    console.log(`[INDEX] migrating IndexDB`);
    const startMs = performance.now();
    let success = false;
    try {
      this.migrateDBInner();
      success = true;
    } catch (e) {
      console.error(`[INDEX] error migrating IndexDB: ${e}`);
    } finally {
      const status = success ? "success" : "error";
      const elapsedMs = (performance.now() - startMs) | 0;
      console.log(`[INDEX] migration ${status} in ${elapsedMs}ms`);
    }
  }

  private async migrateDBInner() {
    await this.pg.query(`
      --
      -- DaimoDB Index setup (filtered)
      --

      CREATE TABLE IF NOT EXISTS index.daimo_block (
        chain_id NUMERIC NOT NULL,
        number NUMERIC NOT NULL,
        hash BYTEA NOT NULL,
        parent_hash BYTEA NOT NULL,
        timestamp NUMERIC NOT NULL,
        inserted_at BYTEA NOT NULL,
        PRIMARY KEY (chain_id, number, hash)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_index (
        chain_id NUMERIC NOT NULL PRIMARY KEY,
        latest_block_num NUMERIC NOT NULL 
      );

      CREATE TABLE IF NOT EXISTS index.daimo_transfer (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,

        sort_idx NUMERIC NOT NULL,
        token BYTEA NOT NULL, -- 0x0 for native token transfers
        f BYTEA NOT NULL,
        t BYTEA NOT NULL,
        amount NUMERIC NOT NULL,
        PRIMARY KEY (chain_id, block_num, sort_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_transfer_tx (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        PRIMARY KEY (chain_id, block_num, tx_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_op (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL,
        log_name TEXT NOT NULL,

        op_hash BYTEA NOT NULL,
        op_sender BYTEA NOT NULL,
        op_paymaster BYTEA NOT NULL,
        op_nonce NUMERIC NOT NULL,
        op_success BOOLEAN NOT NULL,
        op_actual_gas_cost NUMERIC NOT NULL,
        op_actual_gas_used NUMERIC NOT NULL,
        PRIMARY KEY (chain_id, block_num, log_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_request (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL,
        log_name TEXT NOT NULL,

        id NUMERIC NOT NULL,
        recipient BYTEA,
        creator BYTEA,
        amount NUMERIC,
        metadata BYTEA,
        canceller BYTEA,
        fulfiller BYTEA,
        PRIMARY KEY (chain_id, block_num, log_idx)
      ); 

      CREATE TABLE IF NOT EXISTS index.daimo_note (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL,
        log_name TEXT NOT NULL,

        redeemer BYTEA,
        ephemeral_owner BYTEA NOT NULL,
        creator BYTEA NOT NULL,
        amount NUMERIC NOT NULL,
        PRIMARY KEY (chain_id, block_num, log_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_name (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL,
        log_name TEXT NOT NULL,

        addr BYTEA NOT NULL,
        name BYTEA NOT NULL,
        PRIMARY KEY (chain_id, block_num, log_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_acct (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL, -- account factory 
        log_name TEXT NOT NULL,

        addr BYTEA NOT NULL, -- account address
        home_chain_id NUMERIC NOT NULL,
        home_coin BYTEA NOT NULL,
        swapper BYTEA NOT NULL,
        bridger BYTEA NOT NULL,
        key_slot SMALLINT NOT NULL,
        key BYTEA NOT NULL,
        salt BYTEA NOT NULL,
        PRIMARY KEY (chain_id, block_num, log_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_acct_update (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL, -- account address
        log_name TEXT NOT NULL,

        key_slot SMALLINT,
        key BYTEA,
        forwarding_address BYTEA,
        old_home_coin BYTEA,
        new_home_coin BYTEA,
        PRIMARY KEY (chain_id, block_num, log_idx)
      );

      CREATE TABLE IF NOT EXISTS index.daimo_fast_cctp (
        chain_id NUMERIC NOT NULL,
        block_num NUMERIC NOT NULL,
        block_hash BYTEA NOT NULL,
        block_ts NUMERIC NOT NULL,
        tx_idx NUMERIC NOT NULL,
        tx_hash BYTEA NOT NULL,
        log_idx NUMERIC NOT NULL, 
        log_addr BYTEA NOT NULL,
        log_name TEXT NOT NULL,

        handoff_addr BYTEA NOT NULL,
        from_chain_id NUMERIC NOT NULL,
        from_addr BYTEA,
        from_token BYTEA,
        from_amount NUMERIC NOT NULL,
        to_chain_id NUMERIC NOT NULL,
        to_addr BYTEA NOT NULL,
        to_token BYTEA NOT NULL,
        to_amount NUMERIC NOT NULL,
        nonce NUMERIC NOT NULL,
        new_recipient BYTEA,
        final_recipient BYTEA,
        PRIMARY KEY (chain_id, block_num, log_idx)
      );
    `);
  }
}
