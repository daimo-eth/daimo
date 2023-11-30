import {
  DaimoNoteStatus,
  EAccount,
  amountToDollars,
  getEAccountStr,
} from "@daimo/common";
import { Pool } from "pg";
import { Address } from "viem";

//type nameResolver = (address: Address) => Promise<EAccount>;

interface accountGetter {
  getEAccount(address: Address): Promise<EAccount>;
}

/* Ephemeral notes contract. Tracks note creation and redemption. */
export class NoteIndexer {
  private notes: Map<Address, DaimoNoteStatus> = new Map();

  private listeners: ((logs: DaimoNoteStatus[]) => void)[] = [];

  private isInitialized = false;

  constructor(private ag: accountGetter) {}

  addListener(listener: (log: DaimoNoteStatus[]) => void) {
    this.listeners.push(listener);
  }

  async load(pg: Pool, from: bigint, to: bigint) {
    const logs: DaimoNoteStatus[] = [];
    logs.push(...(await this.loadCreated(pg, from, to)));
    logs.push(...(await this.loadRedeemed(pg, from, to)));

    const ls = this.listeners;
    console.log(`[NOTE] ${logs.length} logs for ${ls.length} listeners`);
    ls.forEach((l) => l(logs));
  }

  private async loadCreated(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<DaimoNoteStatus[]> {
    const result = await pg.query(
      `
        select
        block_num,
        encode(block_hash, 'hex') as block_hash,
        encode(tx_hash, 'hex') as tx_hash,
        tx_idx,
        log_idx,
        encode(log_addr, 'hex') as log_addr,
        encode(f, 'hex') as "from",
        encode(ephemeral_owner, 'hex') as "ephemeral_owner",
        amount
      from note_created
      where block_num >= $1 and block_num <= $2
    `,
      [from, to]
    );
    const ops = result.rows.map(async (row) => {
      console.log(`[NOTE] NoteCreated ${row.ephemeral_owner}`);
      const sender = await this.ag.getEAccount(row.from);
      const amount = BigInt(row.amount);
      const dollars = amountToDollars(amount);
      if (this.notes.get(row.ephemeral_owner) != null) {
        throw new Error(
          `dupe NoteCreated: ${row.ephemeral_owner} ${row.tx_hash} ${row.log_idx}`
        );
      }
      const ns: DaimoNoteStatus = {
        status: "confirmed",
        dollars,
        link: {
          type: "note",
          previewSender: getEAccountStr(sender),
          previewDollars: dollars,
          ephemeralOwner: row.ephemeral_owner,
        },
        sender,
      };
      this.notes.set(row.ephemeral_owner, ns);
      return ns;
    });
    return await Promise.all(ops);
  }

  private async loadRedeemed(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<DaimoNoteStatus[]> {
    const result = await pg.query(
      `
        select
        encode(f, 'hex') as "from",
        encode(ephemeral_owner, 'hex') as "ephemeral_owner",
        amount,
        block_num,
        encode(block_hash, 'hex') as block_hash,
        encode(tx_hash, 'hex') as tx_hash,
        tx_idx,
        log_idx,
        encode(log_addr, 'hex') as log_addr
      from note_created
      where block_num >= $1 and block_num <= $2
    `,
      [from, to]
    );
    const ops = result.rows.map(async (row) => {
      const amount = BigInt(row.amount);
      const logInfo = () =>
        `[${row.tx_hash} ${row.log_idx} ${row.ephemeral_owner}]`;
      console.log(`[NOTE] NoteRedeemed ${row.ephemeral_owner}`);

      // Find and sanity check the Note that was redeemed
      const op = this.notes.get(row.ephemeral_owner);
      if (op == null) {
        throw new Error(`bad NoteRedeemed, missing note: ${logInfo()}`);
      } else if (op.status !== "confirmed") {
        throw new Error(`bad NoteRedeemed, already claimed: ${logInfo()}`);
      } else if (op.dollars !== amountToDollars(amount)) {
        throw new Error(`bad NoteRedeemed, wrong amount: ${logInfo()}`);
      }
      // Mark as redeemed
      op.status = row.redeemer === row.from ? "cancelled" : "claimed";
      op.claimer = await this.ag.getEAccount(row.redeemer);
      return op;
    });
    return await Promise.all(ops);
  }

  /** Gets note status, or null if the note is not yet indexed. */
  async getNoteStatus(
    ephemeralOwner: Address
  ): Promise<DaimoNoteStatus | null> {
    const ret = this.notes.get(ephemeralOwner);
    return ret || null;
  }
}
