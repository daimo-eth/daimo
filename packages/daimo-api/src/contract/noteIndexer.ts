import {
  DaimoNoteStatus,
  amountToDollars,
  assert,
  getEAccountStr,
} from "@daimo/common";
import { daimoEphemeralNotesConfig } from "@daimo/contract";
import { Address, Log, decodeEventLog, getAbiItem } from "viem";

import { NameRegistry } from "./nameRegistry";
import { ViemClient } from "../env";

const notesABI = daimoEphemeralNotesConfig.abi;
const createEvent = getAbiItem({ abi: notesABI, name: "NoteCreated" });
const redeemEvent = getAbiItem({ abi: notesABI, name: "NoteRedeemed" });

// TODO: getEventSelector returns incorrect results.
// See https://goerli.basescan.org/tx/0xf1347cc24f8eafee1ff7ea88d964920ffccfe7667e71ac55afd0358840ed84b0#eventlog
//
// Signature: NoteCreated(tuple note)
// Viem getEventSelector calculated: 0xa46e98af3f55868378b594db228856857605fcd89d02713a85bc7563e8083586
// Actual: 0xedafcff52f9510e3fee14034ebd5cb6c302432e2b233738af47ce5596a5bbeed
const createEventSelector = `0xedafcff52f9510e3fee14034ebd5cb6c302432e2b233738af47ce5596a5bbeed`;
const redeemEventSelector = `0xb45f3215e68b9bc29811df32d4910e77331ed2a01d8556bea2012566efa32920`;

export type NoteCreateLog = Log<
  bigint,
  number,
  false,
  typeof createEvent,
  true
>;
export type NoteRedeemLog = Log<
  bigint,
  number,
  false,
  typeof redeemEvent,
  true
>;

export type NoteOpLog =
  | {
      type: "create";
      noteStatus: DaimoNoteStatus;
    }
  | {
      type: "claim";
      noteStatus: DaimoNoteStatus;
    };

/* Ephemeral notes contract. Tracks note creation and redemption. */
export class NoteIndexer {
  private notes: Map<Address, DaimoNoteStatus> = new Map();

  private listeners: ((logs: NoteOpLog[]) => void)[] = [];

  private isInitialized = false;

  constructor(private client: ViemClient, private nameReg: NameRegistry) {}

  async init() {
    await this.client.pipeLogs(
      {
        address: daimoEphemeralNotesConfig.address,
        event: undefined,
      },
      this.parseLogs
    );
    this.isInitialized = true;
  }

  addListener(listener: (log: NoteOpLog[]) => void) {
    assert(this.isInitialized, "NoteIndexer not initialized");
    this.listeners.push(listener);
  }

  private parseLogs = async (logs: Log[]) => {
    if (logs.length === 0) return;
    console.log(`[NOTE] parsing ${logs.length} logs`);

    const opLogs: NoteOpLog[] = [];

    for (const log of logs) {
      const { topics, data } = log;
      const selector = topics[0];
      const abi = daimoEphemeralNotesConfig.abi;
      const args = { abi, topics, data, strict: true } as const;

      const logInfo = () => `[${log.transactionHash} ${log.logIndex}]`;

      if (selector === createEventSelector) {
        const nc = decodeEventLog({ ...args, eventName: "NoteCreated" });
        const { ephemeralOwner, from, amount } = nc.args.note;
        console.log(`[NOTE] NoteCreated ${ephemeralOwner}`);
        if (this.notes.get(ephemeralOwner) != null) {
          throw new Error(`dupe NoteCreated: ${ephemeralOwner} ${logInfo()}`);
        }
        const sender = await this.nameReg.getEAccount(from);
        const dollars = amountToDollars(amount);
        const newNote: DaimoNoteStatus = {
          status: "confirmed",
          dollars,
          link: {
            type: "note",
            previewSender: getEAccountStr(sender),
            previewDollars: dollars,
            ephemeralOwner,
          },
          sender,
        };
        this.notes.set(ephemeralOwner, newNote);

        opLogs.push({ type: "create", noteStatus: newNote });
      } else if (selector === redeemEventSelector) {
        const nr = decodeEventLog({ ...args, eventName: "NoteRedeemed" });
        const { ephemeralOwner, from, amount } = nr.args.note;
        const { redeemer } = nr.args;
        console.log(`[NOTE] NoteRedeemed ${ephemeralOwner}`);

        // Find and sanity check the Note that was redeemed
        const note = this.notes.get(ephemeralOwner);
        if (note == null) {
          throw new Error(
            `bad NoteRedeemed, missing note: ${ephemeralOwner} ${logInfo()}`
          );
        } else if (note.status !== "confirmed") {
          throw new Error(
            `bad NoteRedeemed, already claimed: ${ephemeralOwner} ${logInfo()}`
          );
        } else if (note.dollars !== amountToDollars(amount)) {
          throw new Error(
            `bad NoteRedeemed, wrong amount: ${ephemeralOwner} ${logInfo()}`
          );
        }

        // Mark as redeemed
        note.status = redeemer === from ? "cancelled" : "claimed";
        note.claimer = await this.nameReg.getEAccount(redeemer);

        opLogs.push({ type: "claim", noteStatus: { ...note } });
      } else {
        throw new Error(`unexpected event selector: ${selector}`);
      }
    }

    // Finally, invoke listeners to send notifications etc.
    const ls = this.listeners;
    console.log(`[NOTE] ${opLogs.length} logs for ${ls.length} listeners`);
    ls.forEach((l) => l(opLogs));
  };

  /** Gets note status, or null if the note is not yet indexed. */
  async getNoteStatus(
    ephemeralOwner: Address
  ): Promise<DaimoNoteStatus | null> {
    const ret = this.notes.get(ephemeralOwner);
    return ret || null;
  }
}
