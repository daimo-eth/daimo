import { guessTimestampFromNum } from "@daimo/common";
import { ClientConfig, Pool, PoolConfig } from "pg";

import { chainConfig } from "../env";
import { retryBackoff } from "../utils/retryBackoff";

interface indexer {
  load(pg: Pool, from: number, to: number): void | Promise<void>;
}

const dbConfig: ClientConfig = {
  connectionString: process.env.SHOVEL_DATABASE_URL,
  connectionTimeoutMillis: 20000,
  query_timeout: 20000,
  statement_timeout: 20000,
  database: process.env.SHOVEL_DATABASE_URL == null ? "shovel" : undefined,
};

const poolConfig: PoolConfig = {
  ...dbConfig,
  max: 8,
  idleTimeoutMillis: 60000,
};

export class Watcher {
  // Start from a block before the first Daimo tx on Base and Base Sepolia.
  private latest = 5699999;
  private batchSize = 100000;
  private isIndexing = false;

  // indexers by dependency layers, indexers[0] are indexed first parallely, indexers[1] second, etc.
  private indexerLayers: indexer[][] = [];
  // indexers that are ignored for synchronization, i.e. while they are indexing a old range other
  // indexers may be ahead of them -- this is all for ETHIndexer which sucks.
  private slowIndexers: indexer[] = [];

  private pg: Pool;

  constructor() {
    this.pg = new Pool(poolConfig);
  }

  add(...i: indexer[][]) {
    this.indexerLayers.push(...i);
  }

  slowAdd(...i: indexer[]) {
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
    for (let i = 0; i < tries; i++) {
      if (this.latest >= blockNumber) {
        console.log(
          `[SHOVEL] waiting for block ${blockNumber}, found after ${
            Date.now() - t0
          }ms`
        );
        return true;
      }
      await new Promise((res) => setTimeout(res, 250));
    }
    console.log(
      `[SHOVEL] waiting for block ${blockNumber}, NOT FOUND, still on ${
        this.latest
      } after ${Date.now() - t0}ms`
    );
    return false;
  }

  async migrateDB() {
    await this.pg.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS filtered_erc20_transfers AS (SELECT
      et.*
      FROM erc20_transfers et
      JOIN names n ON n.addr = et.f
        OR n.addr = et.t);`);
  }

  async init() {
    await this.migrateDB();
    const shovelLatest = await this.getShovelLatest();
    await this.catchUpTo(shovelLatest);
  }

  // Watches shovel for new blocks, and indexes them.
  // Skip indexing if it's already indexing.
  async watch() {
    setInterval(async () => {
      try {
        if (this.isIndexing) {
          console.log(`[SHOVEL] skipping tick, already indexing`);
          return;
        }
        this.isIndexing = true;

        const shovelLatest = await this.getShovelLatest();
        const localLatest = await this.index(
          this.latest + 1,
          shovelLatest,
          this.batchSize
        );
        // localLatest <= 0 when there are no new blocks in shovel
        // or, for whatever reason, we are ahead of shovel.
        if (localLatest > this.latest) this.latest = localLatest;
      } finally {
        this.isIndexing = false;
      }
    }, 1000);
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
        layer.map((i) => i.load(this.pg, start, start + limit))
      );
    }
    this.slowIndexers.forEach((i) => i.load(this.pg, start, start + limit)); // no await
    console.log(
      `[SHOVEL] loaded ${start} to ${start + limit} in ${Date.now() - t0}ms`
    );
    return start + limit;
  }

  async getShovelLatest(): Promise<number> {
    const result = await retryBackoff(`shovel-latest-query`, () =>
      this.pg.query(`select num from shovel.latest`)
    );
    return Number(result.rows[0].num);
  }
}
