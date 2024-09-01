import { Kysely } from "kysely";

import { DB as IndexDB } from "../codegen/dbIndex";

export abstract class Indexer {
  public readonly name: string;
  protected lastProcessedBlock = 0;

  constructor(name: string) {
    console.log(`[INDEXER] ${name} constructed`);
    this.name = name;
  }

  // Loads a batch of blocks from the database.
  public abstract load(
    kdb: Kysely<IndexDB>,
    from: number,
    to: number
  ): void | Promise<void>;

  // Checks whether we just completed a stale query. True = don't process.
  // Otherwise, returns false (continue processing) and updates lastProcessedBlock.
  protected updateLastProcessedCheckStale(from: number, to: number) {
    if (this.lastProcessedBlock >= from) {
      console.warn(
        `[${this.name}] SKIPPING ${from}-${to}, already processed through ${this.lastProcessedBlock}`
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
