import {
  DaimoInviteStatus,
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
} from "@daimo/common";
import { Address } from "viem";

import { DB, InviteGraphRow } from "../db/db";
import { retryBackoff } from "../utils/retryBackoff";

/** Offchain invite graph. Used for rich profile displays and invite tab. */
export class InviteGraph {
  private inviters: Map<Address, Address> = new Map();
  private invitees: Map<Address, Address[]> = new Map();

  constructor(private db: DB) {}

  async init() {
    console.log(`[INVITE GRAPH] init`);

    const rows = await retryBackoff(`loadInviteGraph`, () =>
      this.db.loadInviteGraph()
    );

    this.cacheInviteGraphRows(rows);
  }

  getInviter(address: Address): Address | undefined {
    return this.inviters.get(address);
  }

  getInvitees(address: Address): Address[] {
    return this.invitees.get(address) || [];
  }

  cacheInviteGraphRows(rows: InviteGraphRow[]) {
    for (const { inviter, invitee } of rows) {
      this.inviters.set(invitee, inviter);
      this.invitees.set(inviter, [
        ...(this.invitees.get(inviter) || []),
        invitee,
      ]);
    }
  }

  // TODO: populate old graph data
  async addEdge(edge: InviteGraphRow) {
    await retryBackoff(`insertInviteGraph`, () =>
      this.db.insertInviteGraph(edge)
    );
    this.cacheInviteGraphRows([edge]);
  }

  processDeployWallet(address: Address, inviteLinkStatus: DaimoLinkStatus) {
    const inviter = (() => {
      switch (inviteLinkStatus.link.type) {
        case "note":
        case "notev2":
          return (inviteLinkStatus as DaimoNoteStatus).sender.addr;
        case "request":
        case "requestv2":
          return (inviteLinkStatus as DaimoRequestStatus).recipient.addr;
        case "invite":
          return (inviteLinkStatus as DaimoInviteStatus).sender?.addr;
        default:
          return undefined;
      }
    })();

    if (inviter) {
      this.addEdge({ inviter, invitee: address });
    }
  }
}
