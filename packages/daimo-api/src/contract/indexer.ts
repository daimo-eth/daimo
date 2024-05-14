import { Pool } from "pg";

export abstract class Indexer {
  public readonly name: string;
  protected lastProcessedBlock = 0;

  constructor(name: string) {
    console.log(`[INDEXER] ${name} constructed`);
    this.name = name;
  }

  // Loads a batch of blocks from the database.
  public abstract load(
    pg: Pool,
    from: number,
    to: number
  ): void | Promise<void>;

  // Checks whether we just completed a stale query. True = don't process.
  // Otherwise, returns false (coninue processing) and updates lastProcessedBlock.
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
