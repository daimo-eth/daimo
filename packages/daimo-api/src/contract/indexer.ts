import { Kysely } from "kysely";
import { Pool } from "pg";

import { DB as ShovelDB } from "../codegen/dbShovel";
import { chainConfig } from "../env";

export abstract class Indexer {
  public readonly name: string;
  protected lastProcessedBlock = 0;

  protected readonly shovelSource: { event: string; trace: string };

  constructor(name: string) {
    console.log(`[INDEXER] ${name} constructed`);
    this.name = name;

    const { id } = chainConfig.chainL2;
    this.shovelSource = (function () {
      switch (id) {
        case 8453:
          return { event: "base", trace: "baseTrace" };
        case 84532:
          return { event: "baseSepolia", trace: "baseSepoliaTrace" };
        default:
          throw new Error(`Unsupported chain ${id}`);
      }
    })();
  }

  // Loads a batch of blocks from the database.
  public abstract load(
    pg: Pool,
    kdb: Kysely<ShovelDB>,
    from: number,
    to: number
  ): void | Promise<void>;

  // Checks whether we just completed a stale query. True = don't process.
  // Otherwise, returns false (continue processing) and updates lastProcessedBlock.
  protected updateLastProcessedCheckStale(from: number, to: number) {
    if (this.lastProcessedBlock >= from) {
      console.warn(
        `[${this.name}] SKIPPING ${from}-${to}, already processed thru ${this.lastProcessedBlock}`
      );
      return true;
    }
    console.log(
      `[${this.name}] lastProcessedBlock=${this.lastProcessedBlock} > loaded ${from}-${to}`
    );
    this.lastProcessedBlock = to;
    return false;
  }
}
