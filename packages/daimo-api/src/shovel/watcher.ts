import { guessTimestampFromNum, now } from "@daimo/common";
import { ClientConfig, Pool, PoolConfig } from "pg";
import { PublicClient } from "viem";

import { Indexer } from "../contract/indexer";
import { DBNotifications, DB_EVENT_DAIMO_NEW_BLOCK } from "../db/notifications";
import { chainConfig } from "../env";
import { retryBackoff } from "../utils/retryBackoff";

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
  private latest = 5699999;
  private slowLatest = 5699999;
  private batchSize = 100000;
  private isIndexing = false;
  private isSlowIndexing = false;

  // The latest block present in shovel DB, as of the most recent tick.
  private shovelLatest = 0;
  // The latest block as reported directly by the RPC (not shovel)
  private rpcLatest = 0;
  // The latest successful tick.
  private lastGoodTickS = 0;

  // indexers by dependency layers, indexers[0] are indexed first parallely, indexers[1] second, etc.
  private indexerLayers: Indexer[][] = [];
  // indexers that are ignored for synchronization, i.e. while they are indexing a old range other
  // indexers may be ahead of them -- this is all for ETHIndexer which sucks.
  private slowIndexers: Indexer[] = [];

  private pg: Pool;

  constructor(private rpcClient: PublicClient, dbUrl?: string) {
    const { poolConfig, dbConfig } = getShovelDBConfig(dbUrl);
    this.pg = new Pool(poolConfig);
    this.notifications = new DBNotifications(dbConfig);
  }

  add(...i: Indexer[][]) {
    this.indexerLayers.push(...i);
  }

  slowAdd(...i: Indexer[]) {
    this.slowIndexers.push(...i);
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
        tS = Date.now() - t0;
        console.log(
          `[SHOVEL] waiting for block ${blockNumber}, found after ${tS}ms`
        );
        return true;
      }
      await new Promise((res) => setTimeout(res, 250));
    }
    tS = Date.now() - t0;
    console.log(
      `[SHOVEL] waiting for block ${blockNumber}, NOT FOUND, still on ${this.latest} after ${tS}ms`
    );
    return false;
  }

  async migrateDB() {
    console.log(`[SHOVEL] migrateDB: eth_transfers...`);
    await this.pg.query(`
      CREATE INDEX IF NOT EXISTS i_eth_from ON eth_transfers("from");
      CREATE INDEX IF NOT EXISTS i_eth_to ON eth_transfers("to");
    `);

    console.log(`[SHOVEL] migrateDB: filtered_erc20_transfers...`);
    await this.pg.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS filtered_erc20_transfers AS (
        SELECT et.*
        FROM erc20_transfers et
        JOIN names n ON n.addr = et.f
        OR n.addr = et.t
      );
      CREATE INDEX IF NOT EXISTS i_block_num
        ON filtered_erc20_transfers (block_num);
    `);

    console.log(`[SHOVEL] migrateDB: filtered_eth_transfers...`);
    await this.pg.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS filtered_eth_transfers AS (
        SELECT et.*
        FROM eth_transfers et
        JOIN names n ON n.addr = et.to
        OR n.addr = et.from
      );
      CREATE INDEX IF NOT EXISTS i_filtered_eth_transfers_block_num
        ON filtered_eth_transfers (block_num);
    `);
  }

  async init() {
    await this.migrateDB();
    this.shovelLatest = await this.getShovelLatest();
    await this.catchUpTo(this.shovelLatest);
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

      this.shovelLatest = await this.getShovelLatest();
      const localLatest = await this.index(
        this.latest + 1,
        this.shovelLatest,
        this.batchSize
      );
      const { shovelLatest } = this;
      const tickSummary = JSON.stringify({ shovelLatest, localLatest });
      console.log(`[SHOVEL] starting tick ${tickSummary}`);

      if (localLatest - this.slowLatest > 3) {
        // for now, only run ethIndexer every 3 blocks, and don't wait for it to catch up
        this.slowIndex(this.slowLatest + 1, localLatest);
      }
      // localLatest <= 0 when there are no new blocks in shovel
      // or, for whatever reason, we are ahead of shovel.
      if (localLatest > this.latest) this.latest = localLatest;

      // Finally, check RPC to ensure shovel is up to date
      this.rpcLatest = Number(await this.rpcClient.getBlockNumber());
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
    await this.slowIndex(this.slowLatest + 1, stop); // jumps ethIndexer to the end in one go
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
        layer.map((i) => i.load(this.pg, start, start + limit))
      );
    }
    console.log(
      `[SHOVEL] loaded ${start} to ${start + limit} in ${Date.now() - t0}ms`
    );
    return start + limit;
  }

  private async slowIndex(start: number, stop: number) {
    if (this.isSlowIndexing) return;
    this.isSlowIndexing = true;
    for (const i of this.slowIndexers) {
      await i.load(this.pg, start, stop);
    }
    this.slowLatest = stop;
    this.isSlowIndexing = false;
  }

  private async getShovelLatest(): Promise<number> {
    const result = await retryBackoff(`shovel-latest-query`, () =>
      this.pg.query(`select num from shovel.latest`)
    );
    return Number(result.rows[0].num);
  }

  getStatus() {
    const { lastGoodTickS, shovelLatest, rpcLatest } = this;
    const { idleCount, totalCount, waitingCount } = this.pg;
    return {
      lastGoodTickS,
      rpcLatest,
      shovelLatest,
      shovelDB: {
        idleCount,
        totalCount,
        waitingCount,
      },
    };
  }
}
