import {
  DaimoNoteState,
  DaimoNoteStatus,
  amountToDollars,
  assertNotNull,
  getEAccountStr,
  getNoteId,
} from "@daimo/common";
import { Pool } from "pg";
import { Address, Hex, bytesToHex, getAddress } from "viem";

import { NameRegistry } from "./nameRegistry";
import { chainConfig } from "../env";
import { senderIdKey, logCoordinateKey } from "../utils/indexing";
import { retryBackoff } from "../utils/retryBackoff";

interface NoteLog {
  blockNum: number;
  transactionIndex: number;
  logIndex: number;
  transactionHash: Hex;
  from: Address;
  // Null for NoteCreated, non-null for NoteRedeemed
  redeemer: Address | null;
  ephemeralOwner: Address;
  amount: bigint;
  logAddr: Address;
}

/* Ephemeral notes contract. Tracks note creation and redemption. */
export class NoteIndexer extends Indexer {
  // Map (sender, id) -> ephemeralOwner
  private senderIdToOwner: Map<string, Address> = new Map();

  private notes: Map<Address, DaimoNoteStatus> = new Map();
  private listeners: ((logs: DaimoNoteStatus[]) => void)[] = [];
  private logCoordinateToNoteEvent: Map<string, [Address, "create" | "claim"]> =
    new Map();

  constructor(private nameReg: NameRegistry) {}

  async load(pg: Pool, from: number, to: number) {
    // Load notes contract event logs
    const startMs = Date.now();
    const logs = await this.loadNoteLogs(pg, from, to);
    console.log(`[NOTE] ${Date.now() - startMs}ms: loaded ${logs.length} logs`);

    // Update in-memory note statuses
    const notes: DaimoNoteStatus[] = await this.handleNoteLogs(logs);

    // Finally, invoke listeners to send notifications etc
    this.listeners.forEach((l) => l(notes));
  }

  addListener(listener: (log: DaimoNoteStatus[]) => void) {
    this.listeners.push(listener);
  }

  private async loadNoteLogs(
    pg: Pool,
    from: number,
    to: number
  ): Promise<NoteLog[]> {
    const result = await retryBackoff(
      `noteIndexer-logs-query-${from}-${to}`,
      () =>
        pg.query(
          `
      select * from (
        select
          block_num,
          tx_idx,
          log_idx,
          tx_hash,
          f,
          null as redeemer,
          ephemeral_owner,
          amount,
          log_addr
        from note_created
        where block_num >= $1
        and block_num <= $2
        and chain_id = $3
        union 
        select
          block_num,
          tx_idx,
          log_idx,
          tx_hash,
          f,
          redeemer,
          ephemeral_owner,
          amount,
          log_addr
        from note_redeemed
        where block_num >= $1
        and block_num <= $2
        and chain_id = $3
      ) as notelogs
      order by block_num asc, tx_idx asc, log_idx asc
    `,
          [from, to, chainConfig.chainL2.id]
        )
    );
    return result.rows.map(rowToNoteLog);
  }

  async handleNoteLogs(logs: NoteLog[]): Promise<DaimoNoteStatus[]> {
    const statuses = [] as DaimoNoteStatus[];
    for (const l of logs) {
      try {
        if (l.redeemer == null) statuses.push(await this.handleNoteCreated(l));
        else statuses.push(await this.handleNoteRedeemed(l));
      } catch (e) {
        console.error(`[NOTE] Error handling NoteLog: ${e} ${l}`);
      }
    }
    return statuses;
  }

  private async handleNoteCreated(log: NoteLog): Promise<DaimoNoteStatus> {
    console.log(`[NOTE] NoteCreated ${log.ephemeralOwner}`);
    if (this.notes.get(log.ephemeralOwner) != null) {
      throw new Error(`bad NoteCreated: ${log.ephemeralOwner} exists`);
    }
    const id = getNoteId(log.ephemeralOwner);
    const sender = await this.nameReg.getEAccount(log.from);
    const dollars = amountToDollars(log.amount);
    const newNote: DaimoNoteStatus = {
      status: DaimoNoteState.Confirmed,
      dollars,
      id,
      contractAddress: log.logAddr,
      ephemeralOwner: log.ephemeralOwner,
      link: {
        type: "notev2",
        id,
        sender: getEAccountStr(sender),
        dollars,
      },
      sender,
    };
    this.notes.set(log.ephemeralOwner, newNote);

    this.senderIdToOwner.set(senderIdKey(log.from, id), log.ephemeralOwner);
    this.logCoordinateToNoteEvent.set(
      logCoordinateKey(log.transactionHash, log.logIndex),
      [log.ephemeralOwner, "create"]
    );
    return newNote;
  }

  async handleNoteRedeemed(log: NoteLog): Promise<DaimoNoteStatus> {
    console.log(`[NOTE] NoteRedeemed ${log.ephemeralOwner}`);
    const logInfo = () =>
      `[${log.transactionHash} ${log.logIndex} ${log.ephemeralOwner}]`;
    // Find and sanity check the Note that was redeemed
    const note = this.notes.get(log.ephemeralOwner);
    if (note == null) {
      throw new Error(`bad NoteRedeemed, missing note: ${logInfo()}`);
    } else if (note.status !== DaimoNoteState.Confirmed) {
      throw new Error(`bad NoteRedeemed, already claimed: ${logInfo()}`);
    } else if (note.dollars !== amountToDollars(log.amount)) {
      throw new Error(`bad NoteRedeemed, wrong amount: ${logInfo()}`);
    }

    // Mark as redeemed
    this.logCoordinateToNoteEvent.set(
      logCoordinateKey(log.transactionHash, log.logIndex),
      [log.ephemeralOwner, "claim"]
    );
    assertNotNull(log.redeemer, "redeemer is null");
    assertNotNull(log.from, "from is null");
    note.status =
      log.redeemer === log.from
        ? DaimoNoteState.Cancelled
        : DaimoNoteState.Claimed;
    note.claimer = await this.nameReg.getEAccount(assertNotNull(log.redeemer));
    return note;
  }

  getNoteStatusByOwner(ephemeralOwner: Address): DaimoNoteStatus | null {
    return this.notes.get(ephemeralOwner) || null;
  }

  // DEPRECATED: get note status with old link format
  getNoteStatusDeprecatedLink(ephemeralOwner: Address): DaimoNoteStatus | null {
    const newNoteStatus = this.notes.get(ephemeralOwner);
    if (newNoteStatus == null) return null;
    return {
      ...newNoteStatus,
      link: {
        type: "note",
        ephemeralOwner: newNoteStatus.ephemeralOwner!,
        previewSender: getEAccountStr(newNoteStatus.sender),
        previewDollars: newNoteStatus.dollars,
      },
    };
  }

  getNoteStatusbyLogCoordinate(transactionHash: Hex, logIndex: number) {
    const eve = this.logCoordinateToNoteEvent.get(
      logCoordinateKey(transactionHash, logIndex)
    );
    return eve ? [this.getNoteStatusByOwner(eve[0]), eve[1]] : null;
  }

  /** Gets note status, or null if the note is not yet indexed. */
  getNoteStatusById(sender: Address, id: string) {
    const ephemeralOwner = this.senderIdToOwner.get(senderIdKey(sender, id));
    const ret = ephemeralOwner && this.notes.get(ephemeralOwner);
    return ret || null;
  }
}

function rowToNoteLog(r: any): NoteLog {
  return {
    blockNum: r.block_num,
    transactionIndex: r.tx_idx,
    logIndex: r.log_idx,
    transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
    from: getAddress(bytesToHex(r.f, { size: 20 })),
    redeemer: r.redeemer && getAddress(bytesToHex(r.redeemer, { size: 20 })),
    ephemeralOwner: getAddress(bytesToHex(r.ephemeral_owner, { size: 20 })),
    amount: BigInt(r.amount),
    logAddr: getAddress(bytesToHex(r.log_addr, { size: 20 })),
  };
}
