import { KeyData, assert, contractFriendlyKeyToDER } from "@daimo/common";
import { Pool } from "pg";
import { Address, Hex, getAddress } from "viem";

import { ViemClient } from "../network/viemClient";

export interface KeyChange {
  change: "added" | "removed";
  blockNumber: bigint;
  blockHash: Hex;
  transactionHash: Hex;
  transactionIndex: number;
  logIndex: number;
  address: Address;
  account: Address;
  keySlot: number;
  key: [Hex, Hex];
}

export class KeyRegistry {
  /* In-memory indexer, for now. */
  private keyToAddr = new Map<Hex, Address>();
  private addrToLogs = new Map<Address, KeyChange[]>();
  private addrToKeyData = new Map<Address, KeyData[]>();
  private addrToDeploymentTxHash = new Map<Address, Hex>();

  private listeners: ((logs: KeyChange[]) => void)[] = [];

  constructor(private vc: ViemClient) {}

  /** Listener is invoked for all key rotation events. */
  addListener(listener: (logs: KeyChange[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new key rotations. */
  removeListener(listener: (logs: KeyChange[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  async load(pg: Pool, from: bigint, to: bigint) {
    const added = await this.loadKeyChange(pg, from, to, "added");
    const removed = await this.loadKeyChange(pg, from, to, "removed");
    const combined = added.concat(removed);

    const addrToNewLogs: Map<Address, KeyChange[]> = new Map();
    for (const change of combined) {
      const addr = getAddress(change.address);
      const logs = addrToNewLogs.get(addr) || [];
      addrToNewLogs.set(addr, logs.concat([change]));
    }

    for (const addr of addrToNewLogs.keys()) {
      const newLogs = addrToNewLogs.get(addr)!;
      if (this.addrToLogs.get(addr) === undefined) {
        this.addrToLogs.set(addr, []);
      }
      this.addrToLogs.get(addr)!.push(...newLogs);

      this.cacheAddressProperties(addr);
    }

    this.listeners.forEach((l) => l(combined));
  }

  private async loadKeyChange(
    pg: Pool,
    from: bigint,
    to: bigint,
    change: "added" | "removed"
  ): Promise<KeyChange[]> {
    let table: string = "";
    if (change === "added") {
      table = "key_added";
    } else if (change === "removed") {
      table = "key_removed";
    } else {
      throw new Error(`Invalid key change ${change}`);
    }
    const result = await pg.query(
      `
        select
          encode(block_hash, 'hex') as block_hash,
          block_num,
          encode(tx_hash, 'hex') as tx_hash,
          tx_idx,
          log_idx,
          encode(log_addr, 'hex') as log_addr,
          encode(account, 'hex') as account,
          key_slot,
          array_agg(encode(key, 'hex')) as key
        from ${table}
        where block_num >= $1 and block_num <= $2
        group by block_hash, block_num, tx_hash, tx_idx, log_idx, log_addr, account, key_slot
      `,
      [from, to]
    );
    return result.rows.map((row) => ({
      change,
      blockNumber: BigInt(row.block_num),
      blockHash: row.block_hash,
      transactionHash: row.tx_hash,
      transactionIndex: row.tx_idx,
      logIndex: row.log_idx,
      address: row.log_addr,
      account: row.log_addr,
      keySlot: row.key_slot,
      key: row.key.map((k: string) => `0x${k}`) as [Hex, Hex],
    }));
  }

  /** Cache an address's key properties in memory. */
  cacheAddressProperties = (addr: Address) => {
    // deterministically sort all logs
    const sortedLogs = this.addrToLogs.get(addr)!.sort((a, b) => {
      const diff = a.blockNumber - b.blockNumber;
      if (diff !== 0n) return Number(diff);
      return a.logIndex - b.logIndex;
    });

    const currentKeyData: Map<string, KeyData> = new Map();
    for (const log of sortedLogs) {
      if (!log.key) throw new Error("[API] Invalid event, no key");
      const slot = log.keySlot;
      const derKey = contractFriendlyKeyToDER(log.key);

      if (log.change === "added") {
        currentKeyData.set(derKey, {
          pubKey: derKey,
          addedAt: Number(log.blockNumber),
          slot,
        });

        if (!this.addrToDeploymentTxHash.has(addr)) {
          this.addrToDeploymentTxHash.set(addr, log.transactionHash);
        }
      } else if (log.change === "removed") {
        currentKeyData.delete(derKey);
      }
    }

    this.addrToKeyData.set(addr, [...currentKeyData.values()]);

    for (const keyData of currentKeyData.values()) {
      this.keyToAddr.set(keyData.pubKey, addr);
    }
    console.log(
      `[KEY-REG] cached ${
        this.addrToKeyData.get(addr)?.length
      } key(s) for ${addr}`
    );
  };

  /** Find address by DER key */
  async resolveKey(key: Hex): Promise<Address | null> {
    return this.keyToAddr.get(key) || null;
  }

  /** Find all keys and metadata for a daimo account address */
  async resolveAddressKeys(addr: Address): Promise<KeyData[] | null> {
    return this.addrToKeyData.get(addr) || null;
  }

  isDeploymentKeyRotationLog(log: KeyChange) {
    const addr = getAddress(log.address);
    const deploymentTxHash = this.addrToDeploymentTxHash.get(addr);
    assert(deploymentTxHash !== undefined, "No deployment tx hash");
    return log.transactionHash === deploymentTxHash;
  }
}
