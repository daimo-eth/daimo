import {
  assertNotNull,
  guessTimestampFromNum,
  now,
  retryBackoff,
} from "@daimo/common";
import { Kysely, PostgresDialect } from "kysely";
import { ClientConfig, Pool, PoolConfig } from "pg";
import { PublicClient } from "viem";

import { DB as ShovelDB } from "../codegen/dbShovel";
import { Indexer } from "../contract/indexer";
import { DBNotifications, DB_EVENT_DAIMO_NEW_BLOCK } from "../db/notifications";
import { chainConfig } from "../env";

function getShovelDBConfig(dbUrl?: string) {
  const dbConfig: ClientConfig = {
    connectionString: dbUrl,
    connectionTimeoutMillis: 20000,
    query_timeout: 20000,
    statement_timeout: 20000,
    database: dbUrl == null ? "shovel" : undefined,
  };

  const poolConfig: PoolConfig = {
    ...dbConfig,
    min: 1,
    max: 8,
    idleTimeoutMillis: 60000,
  };

  return { poolConfig, dbConfig };
}

export class Watcher {
  readonly notifications: DBNotifications;

  // Start from a block before the first Daimo tx on Base and Base Sepolia.
  private latest;
  private batchSize = 1000_000;
  private isIndexing = false;

  // The latest block through which our DB index is up to date.
  private indexLatest = 0;
  // The latest block as reported directly by the RPC (not shovel)
  private rpcLatest = 0;
  // The latest successful tick.
  private lastGoodTickS = 0;

  // indexers by dependency layers.
  // indexers[0] are indexed first concurrently, indexers[1] second, etc.
  private indexerLayers: Indexer[][] = [];

  public readonly pg: Pool;
  public readonly kdb: Kysely<ShovelDB>;

  constructor(private rpcClient: PublicClient, dbUrl?: string) {
    const { poolConfig, dbConfig } = getShovelDBConfig(dbUrl);
    this.pg = new Pool(poolConfig);
    this.kdb = new Kysely<ShovelDB>({
      dialect: new PostgresDialect({ pool: this.pg }),
    });
    this.notifications = new DBNotifications(dbConfig);

    const { testnet } = assertNotNull(rpcClient.chain);
    if (testnet) this.latest = 12000000 - 1;
    else this.latest = 5700000 - 1;
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
          `[SHOVEL] waiting for block ${blockNumber}, found after ${tS}ms`
        );
        return true;
      }
      await new Promise((res) => setTimeout(res, 250));
    }
    tS = (Date.now() - t0) | 0;
    console.log(
      `[SHOVEL] waiting for block ${blockNumber}, NOT FOUND, still on ${this.latest} after ${tS}ms`
    );
    return false;
  }

  async init() {
    this.indexLatest = await this.getIndexLatest();
    await this.catchUpTo(this.indexLatest);
  }

  // Watches shovel for new blocks, and indexes them.
  // Skip indexing if it's already indexing.
  async watch() {
    this.notifications.on(DB_EVENT_DAIMO_NEW_BLOCK, async () => this.tick());

    // DB notifications unreliable. Backup tick.
    setInterval(() => this.tick(), 1000);
  }

  async tick() {
    try {
      if (this.isIndexing) {
        console.log(`[SHOVEL] skipping tick, already indexing`);
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
        console.log(`[SHOVEL] skipping tick, no new blocks`);
        return;
      }

      // New block(s) available. Index them.
      const { rpcLatest, latest, indexLatest, batchSize } = this;
      const newLatest = await this.index(latest + 1, indexLatest, batchSize);

      const dbg = JSON.stringify({ rpcLatest, indexLatest, latest, newLatest });
      console.log(`[SHOVEL] tick success ${dbg}`);
      this.latest = newLatest;
      this.lastGoodTickS = now();
    } catch (e) {
      console.error(`[SHOVEL] tick error`, e);
    } finally {
      this.isIndexing = false;
    }
  }

  // Indexes batches till we get to the given block number, inclusive.
  async catchUpTo(stop: number) {
    while (this.latest < stop) {
      this.latest = await this.index(this.latest + 1, stop, this.batchSize);
    }
    console.log(`[SHOVEL] initialized to ${this.latest}`);
  }

  // Indexes a single batch of blocks.
  // Returns new tip block number on success, 0 if stop<start (= no new blocks).
  private async index(start: number, stop: number, n: number): Promise<number> {
    const t0 = Date.now();
    const delta = stop - start;
    if (delta < 0) return 0;
    const limit = delta >= n ? n - 1 : delta;
    console.log(`[SHOVEL] loading ${start} to ${start + limit}`);
    for (const [, layer] of this.indexerLayers.entries()) {
      await Promise.all(
        layer.map((i) => i.load(this.pg, this.kdb, start, start + limit))
      );
    }
    console.log(
      `[SHOVEL] loaded ${start} to ${start + limit} in ${Date.now() - t0}ms`
    );
    return start + limit;
  }

  async getIndexLatest(): Promise<number> {
    const result = await retryBackoff(`s^2-latest-query`, () =>
      this.pg.query(
        `select least(
          (select min(num) from shovel.latest),
          (select latest_block_num from shovel.daimo_index where chain_id=$1)
        ) as index_latest;
        `,
        [chainConfig.chainL2.id]
      )
    );
    return Number(result.rows[0].index_latest);
  }

  getStatus() {
    const { lastGoodTickS, indexLatest, rpcLatest } = this;
    const { idleCount, totalCount, waitingCount } = this.pg;
    return {
      lastGoodTickS,
      rpcLatest,
      indexLatest,
      shovelDB: {
        idleCount,
        totalCount,
        waitingCount,
      },
    };
  }
}
