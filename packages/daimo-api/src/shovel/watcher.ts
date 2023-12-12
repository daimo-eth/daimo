import { ClientConfig, Pool, PoolConfig } from "pg";
import { Block } from "viem";

import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

interface indexer {
  load(pg: Pool, from: bigint, to: bigint): void | Promise<void>;
}

const dbConfig: ClientConfig = {
  connectionString: process.env.SHOVEL_DATABASE_URL,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
  database: process.env.SHOVEL_DATABASE_URL == null ? "shovel" : undefined,
};

const poolConfig: PoolConfig = {
  ...dbConfig,
  max: 8,
  idleTimeoutMillis: 60000,
};

export class Watcher {
  private latest = chainConfig.chainL2.testnet ? 8750000n : 5700000n;
  private latestCachedBlock: Block | undefined;
  private batchSize = 10000n;
  private vc: ViemClient;

  private indexers: indexer[] = [];
  private pg: Pool;

  constructor(vc: ViemClient) {
    this.pg = new Pool(poolConfig);
    this.vc = vc;
  }

  add(...i: indexer[]) {
    this.indexers.push(...i);
  }

  async latestBlock(): Promise<Block> {
    if (this.latestCachedBlock?.number === this.latest) {
      return this.latestCachedBlock;
    }
    this.latestCachedBlock = await this.vc.publicClient.getBlock({
      blockNumber: this.latest,
    });
    return this.latestCachedBlock;
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
    const result = await this.pg.query(
      `
      select max(num) as num
      from shovel.task_updates
      where chain_id = $1
      and backfill = false;
    `,
      [chainConfig.chainL2.id]
    );
    return BigInt(result.rows[0].num);
  }
}
