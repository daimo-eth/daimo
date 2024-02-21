import {
  LinkedAccount,
  ProfileLink,
  assertEqual,
  zFarcasterLinkedAccount,
} from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import { Address, Hex, getAddress, hashMessage } from "viem";

import { DB } from "../db/db";
import { ViemClient } from "../network/viemClient";

export class ProfileCache {
  private links: ProfileLink[] = [];
  private linkedAccounts: Map<Address, LinkedAccount[]> = new Map();

  constructor(private vc: ViemClient, private db: DB) {}

  // Populates linked accounts from DB
  async init() {
    const rows = await this.db.loadLinkedAccounts();
    for (const row of rows) {
      const link: ProfileLink = {
        addr: getAddress(row.address),
        linkedAccount: JSON.parse(row.signed_json) as LinkedAccount,
      };
      this.links.push(link);
    }
    this.reindex();

    console.log(`[PROFILE] loaded ${this.links.length} linked accounts`);
  }

  private reindex() {
    this.linkedAccounts.clear();
    for (const link of this.links) {
      const linked = this.linkedAccounts.get(link.addr) || [];
      linked.push(link.linkedAccount);
      this.linkedAccounts.set(link.addr, linked);
    }
  }

  async linkAccount(
    addr: Address,
    linkedAccountJSON: string,
    signature: Hex
  ): Promise<LinkedAccount[]> {
    console.log(`[PROFILE] linking: ${linkedAccountJSON} to addr: ${addr}`);

    // Validate, save in DB
    const linkedAccount = await linkAccount(
      addr,
      linkedAccountJSON,
      signature,
      this.vc,
      this.db
    );

    // Index in memory
    const link: ProfileLink = { addr, linkedAccount };
    this.indexLinkedAccount(link);

    // Return all accounts for this address
    return this.getLinkedAccounts(addr);
  }

  getLinkedAccounts(addr: Address): LinkedAccount[] {
    return this.linkedAccounts.get(addr) || [];
  }

  private indexLinkedAccount(link: ProfileLink) {
    // Remove conflicting links
    this.links = this.links.filter(
      (l) =>
        l.linkedAccount.type !== link.linkedAccount.type ||
        l.addr !== link.addr ||
        l.linkedAccount.id !== link.linkedAccount.id
    );

    // Add new link
    this.links.push(link);
    this.reindex();
  }
}

async function linkAccount(
  addr: Address,
  linkedAccountJSON: string,
  signature: Hex,
  vc: ViemClient,
  db: DB
): Promise<LinkedAccount> {
  console.log(`[PROFILE] linking: ${linkedAccountJSON}, sig: ${signature}`);

  // Verify signature
  const messageHash = hashMessage(linkedAccountJSON);
  const verifySigResult = await vc.publicClient.readContract({
    abi: daimoAccountABI,
    address: addr,
    functionName: "isValidSignature",
    args: [messageHash, signature],
  });
  assertEqual(verifySigResult, "0x1626ba7e", "ERC-1271 sig validation failed");

  const linkedAcc = JSON.parse(linkedAccountJSON);
  switch (linkedAcc.type) {
    case "farcaster":
      return linkFarcaster(addr, linkedAccountJSON, signature, db);
    default:
      throw new Error(`Unsupported linked account ${linkedAccountJSON}`);
  }
}

async function linkFarcaster(
  addr: Address,
  linkedAccountJSON: string,
  signature: Hex,
  db: DB
): Promise<LinkedAccount> {
  // TODO: write to DB
  // Return full list of linked accounts
  const linkedAcc = JSON.parse(linkedAccountJSON);
  const fcAccount = zFarcasterLinkedAccount.parse(linkedAcc);

  await db.saveLinkedAccount({
    linked_type: "farcaster",
    linked_id: getAddress(fcAccount.custody),
    address: addr,
    signed_json: linkedAccountJSON,
    signature_hex: signature,
  });

  return fcAccount;
}
