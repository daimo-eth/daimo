import { retryBackoff } from "@daimo/common";
import { Hex } from "viem";

import { DB, PaymentMemoRow } from "../db/db";

/** Offchain payment memos. User-generated notes for the transfer. */
export class PaymentMemoTracker {
  // Map of memos, keyed by userop hash
  private memos: Map<Hex, string> = new Map();

  constructor(private db: DB) {}

  async init() {
    console.log(`[MEMO] init`);

    // Get memos sorted by creation time
    const rows = await retryBackoff(`loadPaymentMemos`, () =>
      this.db.loadPaymentMemos()
    );

    this.cachePaymentMemos(rows);
  }

  private cachePaymentMemos(rows: PaymentMemoRow[]) {
    for (const { opHash, memo } of rows) {
      this.memos.set(opHash, memo);
    }
  }

  // Get payment memo for a given userop hash
  getMemo(opHash: Hex): string | undefined {
    return this.memos.get(opHash);
  }

  async addMemo(opHash: Hex, memo: string) {
    await retryBackoff(`insertPaymentMemo`, () =>
      this.db.insertPaymentMemo({ opHash, memo })
    );
    this.cachePaymentMemos([{ opHash, memo }]);
  }
}
