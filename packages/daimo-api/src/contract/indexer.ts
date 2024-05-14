export class Indexer {
  public readonly name: string;
  protected lastProcessedBlock = 0;

  constructor(name: string) {
    console.log(`[INDEXER] ${name} constructed`);
    this.name = name;
  }

  // Checks whether we just completed a stale query. True = don't process.
  // Otherwise, returns false (coninue processing) and updates lastProcessedBlock.
  protected updateLastProcessedCheckStale(from: number, to: number) {
    if (this.lastProcessedBlock >= from) {
      console.log(
        `[${this.name}] SKIPPING ${from}-${to}, already processed thru ${this.lastProcessedBlock}`
      );
      return true;
    }
    this.lastProcessedBlock = to;
    return false;
  }
}
