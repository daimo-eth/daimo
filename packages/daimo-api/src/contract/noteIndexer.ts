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

// log coordinate key: [transactionHash, logIndex]
function logCoordinateKey(transactionHash: Hex, logIndex: number) {
  return transactionHash + ":" + logIndex;
}

function senderIdKey(sender: Address, id: string) {
  return sender + ":" + id;
}

interface NoteCreatedLog {
  blockNum: number;
  transactionIndex: number;
  logIndex: number;
  transactionHash: Hex;
  from: Address;
  ephemeralOwner: Address;
  amount: bigint;
  logAddr: Address;
}

interface NoteRedeemedLog {
  blockNum: number;
  transactionIndex: number;
  logIndex: number;
  transactionHash: Hex;
  from: Address;
  redeemer: Address;
  ephemeralOwner: Address;
  amount: bigint;
  logAddr: Address;
}

type NoteLog = NoteCreatedLog | NoteRedeemedLog;

/* Ephemeral notes contract. Tracks note creation and redemption. */
export class NoteIndexer {
  // Map (sender, id) -> ephemeralOwner
  private senderIdToOwner: Map<string, Address> = new Map();

  private notes: Map<Address, DaimoNoteStatus> = new Map();
  private listeners: ((logs: DaimoNoteStatus[]) => void)[] = [];
  private logCoordinateToNoteEvent: Map<string, [Address, "create" | "claim"]> =
    new Map();

  constructor(private nameReg: NameRegistry) {}

  async load(pg: Pool, from: bigint, to: bigint) {
    const startTime = Date.now();
    const logs: NoteLog[] = [];
    logs.push(...(await this.loadCreated(pg, from, to)));
    logs.push(...(await this.loadRedeemed(pg, from, to)));
    logs.sort((a, b) => {
      const l = a.blockNum - b.blockNum;
      if (l !== 0) return l;
      return a.logIndex - b.logIndex;
    });

    const notes: DaimoNoteStatus[] = await this.handleNoteLogs(logs);
    console.log(
      `[NOTE] Loaded ${logs.length} notes in ${Date.now() - startTime}ms`
    );
    // Finally, invoke listeners to send notifications etc.
    const ls = this.listeners;
    ls.forEach((l) => l(notes));
  }

  addListener(listener: (log: DaimoNoteStatus[]) => void) {
    this.listeners.push(listener);
  }

  private async loadCreated(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<NoteLog[]> {
    const result = await pg.query(
      `
        select
          block_num,
          tx_idx,
          log_idx,
          tx_hash,
          f,
          ephemeral_owner,
          amount,
          log_addr
        from note_created
        where block_num >= $1
        and block_num <= $2
        and chain_id = $3
        order by (block_num, tx_idx, log_idx) asc
    `,
      [from, to, chainConfig.chainL2.id]
    );
    return result.rows.map(rowToNoteCreatedLog);
  }

  private async handleNoteCreated(
    log: NoteCreatedLog
  ): Promise<DaimoNoteStatus> {
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

  private async loadRedeemed(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<NoteLog[]> {
    const result = await pg.query(
      `
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
    `,
      [from, to, chainConfig.chainL2.id]
    );
    return result.rows.map(rowToNoteRedeemedLog);
  }

  async handleNoteLogs(logs: NoteLog[]): Promise<DaimoNoteStatus[]> {
    const statuses = [] as DaimoNoteStatus[];
    for (const l of logs) {
      try {
        if ("redeemer" in l) statuses.push(await this.handleNoteRedeemed(l));
        else statuses.push(await this.handleNoteCreated(l));
      } catch (e) {
        console.error(`[NOTE] Error handling NoteLog: ${e} ${l}`);
      }
    }
    return statuses;
  }

  async handleNoteRedeemed(log: NoteRedeemedLog): Promise<DaimoNoteStatus> {
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
    note.claimer = await this.nameReg.getEAccount(log.redeemer);
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

function rowToNoteCreatedLog(r: any): NoteCreatedLog {
  return {
    blockNum: r.block_num,
    transactionIndex: r.tx_idx,
    logIndex: r.log_idx,
    transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
    from: getAddress(bytesToHex(r.f, { size: 20 })),
    ephemeralOwner: getAddress(bytesToHex(r.ephemeral_owner, { size: 20 })),
    amount: BigInt(r.amount),
    logAddr: getAddress(bytesToHex(r.log_addr, { size: 20 })),
  };
}

function rowToNoteRedeemedLog(r: any): NoteRedeemedLog {
  return {
    blockNum: r.block_num,
    transactionIndex: r.tx_idx,
    logIndex: r.log_idx,
    transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
    from: getAddress(bytesToHex(r.f, { size: 20 })),
    redeemer: getAddress(bytesToHex(r.redeemer, { size: 20 })),
    ephemeralOwner: getAddress(bytesToHex(r.ephemeral_owner, { size: 20 })),
    amount: BigInt(r.amount),
    logAddr: getAddress(bytesToHex(r.log_addr, { size: 20 })),
  };
}
