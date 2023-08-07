import { DaimoNoteStatus, amountToDollars } from "@daimo/common";
import { ephemeralNotesABI, ephemeralNotesAddress } from "@daimo/contract";
import { Address, Log, decodeEventLog, getAbiItem, getContract } from "viem";

import { NameRegistry } from "./nameRegistry";
import { ContractType, ViemClient } from "../chain";

const createEvent = getAbiItem({ abi: ephemeralNotesABI, name: "NoteCreated" });
const redeemEvent = getAbiItem({
  abi: ephemeralNotesABI,
  name: "NoteRedeemed",
});

// TODO: getEventSelector returns incorrect results.
// See https://goerli.basescan.org/tx/0xf1347cc24f8eafee1ff7ea88d964920ffccfe7667e71ac55afd0358840ed84b0#eventlog
//
// Signature: NoteCreated(tuple note)
// Viem getEventSelector calculated: 0xa46e98af3f55868378b594db228856857605fcd89d02713a85bc7563e8083586
// Actual: 0xedafcff52f9510e3fee14034ebd5cb6c302432e2b233738af47ce5596a5bbeed
const createEventSelector = `0xedafcff52f9510e3fee14034ebd5cb6c302432e2b233738af47ce5596a5bbeed`;
const redeemEventSelector = `0xb45f3215e68b9bc29811df32d4910e77331ed2a01d8556bea2012566efa32920`;

export type NoteCreateLog = Log<bigint, number, typeof createEvent, true>;
export type NoteRedeemLog = Log<bigint, number, typeof redeemEvent, true>;

/* Ephemeral notes contract. Tracks note creation and redemption. */
export class NoteIndexer {
  private contract: ContractType<typeof ephemeralNotesABI>;

  private notes: Map<Address, DaimoNoteStatus> = new Map();

  constructor(private client: ViemClient, private nameReg: NameRegistry) {
    this.contract = getContract({
      abi: ephemeralNotesABI,
      address: ephemeralNotesAddress,
      ...this.client,
    });
  }

  async init() {
    await this.client.pipeLogs(
      {
        address: this.contract.address,
        event: undefined,
      },
      this.parseLogs
    );
  }

  private parseLogs = async (logs: Log[]) => {
    if (logs.length === 0) return;
    console.log(`[NOTE] parsing ${logs.length} logs`);

    for (const log of logs) {
      const { topics, data } = log;
      const selector = topics[0];
      const abi = ephemeralNotesABI;
      const args = { abi, topics, data, strict: true } as const;

      const logInfo = () => `[${log.transactionHash} ${log.logIndex}]`;

      if (selector === createEventSelector) {
        const nc = decodeEventLog({ ...args, eventName: "NoteCreated" });
        const { ephemeralOwner, from, amount } = nc.args.note;
        if (this.notes.get(ephemeralOwner) != null) {
          throw new Error(`dupe NoteCreated: ${ephemeralOwner} ${logInfo()}`);
        }
        this.notes.set(ephemeralOwner, {
          status: "pending",
          dollars: amountToDollars(amount),
          link: { type: "note", ephemeralOwner },
          sender: await this.nameReg.getEAccount(from),
        });
      } else if (selector === redeemEventSelector) {
        const nr = decodeEventLog({ ...args, eventName: "NoteRedeemed" });
        const { ephemeralOwner, from, amount } = nr.args.note;
        const { redeemer } = nr.args;

        // Find and sanity check the Note that was redeemed
        const note = this.notes.get(ephemeralOwner);
        if (note == null) {
          throw new Error(
            `bad NoteRedeemed, missing note: ${ephemeralOwner} ${logInfo()}`
          );
        } else if (note.status !== "pending") {
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
      } else {
        throw new Error(`unexpected event selector: ${selector}`);
      }
    }
  };

  /** Gets unclaimed note amount, or 0 if note is claimed. */
  async getNoteStatus(ephemeralOwner: Address): Promise<DaimoNoteStatus> {
    const ret = this.notes.get(ephemeralOwner);
    if (ret == null) throw new Error(`missing note ${ephemeralOwner}`);
    return ret;
  }
}
