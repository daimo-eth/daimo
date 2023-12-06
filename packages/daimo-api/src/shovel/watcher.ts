import { Pool } from "pg";

interface indexer {
  load(pg: Pool, from: bigint, to: bigint): void | Promise<void>;
}

export class Watcher {
  private srcName: string = "base";
  private latest: bigint = 5700000n;
  private batchSize = 10000n;

  private indexers: indexer[] = [];
  private pg: Pool = new Pool({ connectionString: "postgres:///shovel" });

  add(...i: indexer[]) {
    this.indexers.push(...i);
  }

  async watch() {
    setInterval(async () => {
      const shovelLatest = await this.getShovelLatest();
      await this.index(this.latest + 1n, shovelLatest, this.batchSize);
    }, 1000);
  }

  async init(start: bigint, stop: bigint) {
    this.latest = start - 1n;
    while (this.latest < stop) {
      this.latest = await this.index(this.latest + 1n, stop, this.batchSize);
    }
    console.log(`[SHOVEL] initialized to ${this.latest}`);
  }

  private async index(start: bigint, stop: bigint, n: bigint): Promise<bigint> {
    const delta = stop - start;
    if (delta <= 0n) return 0n;
    const limit = delta > n ? n : delta;
    console.log(`[SHOVEL] loading ${start} to ${start + limit}`);
    await Promise.all(
      this.indexers.map((i) => i.load(this.pg, start, start + limit))
    );
    return start + limit;
  }

  async getShovelLatest(): Promise<bigint> {
    const result = await this.pg.query(
      `
      select max(num) as num 
      from shovel.task_updates
      where src_name = $1
      and backfill = false;
    `,
      [this.srcName]
    );
    return BigInt(result.rows[0].num);
  }
}
