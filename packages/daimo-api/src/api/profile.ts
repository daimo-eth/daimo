import {
  LinkedAccount,
  ProfileLink,
  ProfileLinkID,
  assert,
  daimoDomainAddress,
  zFarcasterLinkedAccount,
  zOffchainAction,
} from "@daimo/common";
import { Address, Hex, getAddress, hashMessage } from "viem";

import { DB } from "../db/db";
import { ViemClient } from "../network/viemClient";
import { verifyERC1271Signature } from "../utils/verifySignature";

export class ProfileCache {
  private links: ProfileLink[] = [];
  private linkedAccounts: Map<Address, LinkedAccount[]> = new Map();
  private fidToAddress: Map<number, Address> = new Map();

  constructor(private vc: ViemClient, private db: DB) {}

  static getDispUsername(link: LinkedAccount): string {
    switch (link.type) {
      case "farcaster":
        if (link.username != null) return `@${link.username}`;
        else return `#${link.fid}`;
      default:
        throw new Error(`Unknown link type ${link.type}`);
    }
  }

  // API handler
  async updateProfileLinks(addr: Address, actionJSON: string, signature: Hex) {
    const isValidSignature = await verifyERC1271Signature(
      this.vc,
      addr,
      hashMessage(actionJSON),
      signature
    );
    assert(isValidSignature, "Invalid ERC-1271 signature");

    // Validate and save to DB
    const action = zOffchainAction.parse(JSON.parse(actionJSON));
    await this.db.saveOffchainAction({
      id: 0,
      address: addr,
      time: action.time,
      type: action.type,
      action_json: actionJSON,
      signature_hex: signature,
    });

    // Execute
    switch (action.type) {
      case "profileLink":
        return this.linkAccount(addr, action.link.linkedAccount);
      case "profileUnlink":
        return this.unlinkAccount(addr, action.linkID);
      default:
        throw new Error(`Unsupported offchain action ${actionJSON}`);
    }
  }

  // Populates linked accounts from DB
  async init() {
    const rows = await this.db.loadLinkedAccounts();
    for (const row of rows) {
      const link: ProfileLink = {
        addr: getAddress(row.address),
        linkedAccount: JSON.parse(row.account_json) as LinkedAccount,
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
      this.fidToAddress.set(link.linkedAccount.fid, link.addr);
    }
  }

  async linkAccount(
    addr: Address,
    linkedAccount: LinkedAccount
  ): Promise<LinkedAccount[]> {
    const linkedAccJSON = JSON.stringify(linkedAccount);
    console.log(`[PROFILE] linking: ${linkedAccJSON} to addr: ${addr}`);

    // Save to DB
    await _linkAccount(addr, linkedAccount, this.db);

    // Index in memory
    const link: ProfileLink = { addr, linkedAccount };
    this.indexLinkedAccount(link);
    this.fidToAddress.set(linkedAccount.fid, addr);

    // Return all accounts for this address
    return this.getLinkedAccounts(addr);
  }

  async unlinkAccount(
    addr: Address,
    linkID: ProfileLinkID
  ): Promise<LinkedAccount[]> {
    console.log(`[PROFILE] unlinking ${linkID.type} ${linkID.id} from ${addr}`);

    // Remove from DB
    await this.db.deleteLinkedAccount(linkID);

    // Remove from memory
    this.links = this.links.filter(
      (l) =>
        l.addr !== linkID.addr ||
        l.linkedAccount.type !== linkID.type ||
        l.linkedAccount.id !== linkID.id
    );
    this.reindex();

    // Return all accounts for this address
    return this.getLinkedAccounts(addr);
  }

  getLinkedAccounts(addr: Address): LinkedAccount[] {
    return this.linkedAccounts.get(addr) || [];
  }

  getAddress(fid: number): Address | undefined {
    return this.fidToAddress.get(fid);
  }

  getProfilePicture(addr: Address) {
    return this.getLinkedAccounts(addr)?.[0]?.pfpUrl
      ? `${daimoDomainAddress}/profile/${addr}/pfp`
      : undefined;
  }

  searchLinkedAccounts(prefix: string): ProfileLink[] {
    if (prefix.length < 2) return [];
    return this.links.filter((l) => {
      const { username, displayName } = l.linkedAccount;
      const match = (s: string) =>
        s.startsWith(prefix) || (prefix.length > 3 && s.includes(prefix));
      return match(username || "") || match(displayName || "");
    });
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

async function _linkAccount(
  addr: Address,
  linkedAcc: LinkedAccount,
  db: DB
): Promise<LinkedAccount> {
  switch (linkedAcc.type) {
    case "farcaster":
      return linkFarcaster(addr, linkedAcc, db);
    default:
      throw new Error(`Unsupported linked account type: ${linkedAcc.type}`);
  }
}

async function linkFarcaster(
  addr: Address,
  linkedAcc: LinkedAccount,
  db: DB
): Promise<LinkedAccount> {
  // Save to DB
  const fcAccount = zFarcasterLinkedAccount.parse(linkedAcc);

  await db.saveLinkedAccount({
    linked_type: "farcaster",
    linked_id: getAddress(fcAccount.custody),
    address: addr,
    account_json: JSON.stringify(fcAccount),
  });

  return fcAccount;
}
