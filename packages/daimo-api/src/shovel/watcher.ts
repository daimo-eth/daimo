import { guessTimestampFromNum } from "@daimo/common";
import { ClientConfig, Pool, PoolConfig } from "pg";

import { chainConfig } from "../env";

interface indexer {
  load(pg: Pool, from: bigint, to: bigint): void | Promise<void>;
}

const dbConfig: ClientConfig = {
  connectionString: process.env.SHOVEL_DATABASE_URL,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
  statement_timeout: 10000,
  database: process.env.SHOVEL_DATABASE_URL == null ? "shovel" : undefined,
};

const poolConfig: PoolConfig = {
  ...dbConfig,
  max: 8,
  idleTimeoutMillis: 60000,
};

export class Watcher {
  private latest = chainConfig.chainL2.testnet ? 8750000n : 5700000n;
  private batchSize = 100000n;

  private indexers: indexer[] = [];
  private pg: Pool;

  constructor() {
    this.pg = new Pool(poolConfig);
  }

  add(...i: indexer[]) {
    this.indexers.push(...i);
  }

  latestBlock(): { number: bigint; timestamp: number } {
    return {
      number: this.latest,
      timestamp: guessTimestampFromNum(this.latest, chainConfig.daimoChain),
    };
  }

  async waitFor(blockNumber: bigint, tries: number): Promise<boolean> {
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

  async init() {
    await this.indexRange(this.latest, await this.getShovelLatest());
  }

  async watch() {
    setInterval(async () => {
      const shovelLatest = await this.getShovelLatest();
      const localLatest = await this.index(
        this.latest + 1n,
        shovelLatest,
        this.batchSize
      );
      // localLatest <= 0 when there are no new blocks in shovel
      // or, for whatever reason, we are ahead of shovel.
      if (localLatest > this.latest) this.latest = localLatest;
    }, 1000);
  }

  async indexRange(start: bigint, stop: bigint) {
    this.latest = start - 1n;
    while (this.latest < stop) {
      this.latest = await this.index(this.latest + 1n, stop, this.batchSize);
    }
    console.log(`[SHOVEL] initialized to ${this.latest}`);
  }

  private async index(start: bigint, stop: bigint, n: bigint): Promise<bigint> {
    const t0 = Date.now();
    const delta = stop - start;
    if (delta <= 0n) return 0n;
    const limit = delta > n ? n : delta;
    console.log(`[SHOVEL] loading ${start} to ${start + limit}`);
    await Promise.all(
      this.indexers.map((i) => i.load(this.pg, start, start + limit))
    );
    console.log(
      `[SHOVEL] loaded ${start} to ${start + limit} in ${Date.now() - t0}ms`
    );
    return start + limit;
  }

  async getShovelLatest(): Promise<bigint> {
    const result = await this.pg.query(`select num from shovel.latest`);
    return BigInt(result.rows[0].num);
  }
}
