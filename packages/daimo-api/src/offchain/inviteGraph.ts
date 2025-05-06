import { DaimoLinkStatus, getInviteStatus, retryBackoff } from "@daimo/common";
import { Address } from "viem";

import { DB, InviteGraphRow } from "../db/db";

/** Offchain invite graph. Used for rich profile displays and invite tab. */
export class InviteGraph {
  private inviters: Map<Address, Address> = new Map();
  private invitees: Map<Address, Address[]> = new Map();

  constructor(private db: DB) {}

  async init() {
    console.log(`[INVITE GRAPH] init`);

    // Get edges sorted by creation time
    const rows = await retryBackoff(`loadInviteGraph`, () =>
      this.db.loadInviteGraph()
    );

    this.cacheInviteGraphRows(rows);
  }

  getInviter(address: Address): Address | undefined {
    return this.inviters.get(address);
  }

  // Get all invitees of a given inviter, sorted by creation time
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
    const inviter = getInviteStatus(inviteLinkStatus).sender?.addr;

    if (inviter) {
      this.addEdge({ inviter, invitee: address });
    }
  }
}
