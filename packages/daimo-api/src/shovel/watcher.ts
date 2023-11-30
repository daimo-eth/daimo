import { Pool } from "pg";

interface indexer {
  load(pg: Pool, from: bigint, to: bigint): void | Promise<void>;
}

export class Watcher {
  private srcName: string = "baseg";
  private latest: bigint = 7353765n;
  private batchSize = 1000n;

  private indexers: indexer[] = [];
  private pg: Pool = new Pool({ connectionString: "postgres:///shovel" });

  add(...i: indexer[]) {
    this.indexers.push(...i);
  }

  async run() {
    const shovelLatest = await this.getShovelLatest();
    const delta = shovelLatest - this.latest;
    if (delta <= 0n) return;

    const limit = delta > this.batchSize ? this.batchSize : delta;
    const from = this.latest + 1n;
    const to = from + limit;
    console.log(`[SHOVEL] loading ${from} to ${to}`);
    await Promise.all(this.indexers.map((i) => i.load(this.pg, from, to)));
    this.latest = to;
  }

  private async getShovelLatest(): Promise<bigint> {
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
