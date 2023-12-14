import { KeyData, assert, contractFriendlyKeyToDER } from "@daimo/common";
import { Pool } from "pg";
import { Address, Hex, bytesToHex, getAddress } from "viem";

import { chainConfig } from "../env";

export interface KeyChange {
  change: "added" | "removed";
  blockNumber: bigint;
  transactionIndex: number;
  transactionHash: Hex;
  logIndex: number;
  address: Address;
  account: Address;
  keySlot: number;
  key: [Hex, Hex];
}

export class KeyRegistry {
  private addrToLogs = new Map<Address, KeyChange[]>();

  private keyToAddr = new Map<Hex, Address>();
  private addrToKeyData = new Map<Address, KeyData[]>();
  private addrToDeploymentTxHash = new Map<Address, Hex>();

  private listeners: ((logs: KeyChange[]) => void)[] = [];

  addListener(listener: (logs: KeyChange[]) => void) {
    this.listeners.push(listener);
  }

  async load(pg: Pool, from: bigint, to: bigint) {
    const startTime = Date.now();
    const changes: KeyChange[] = [];
    changes.push(...(await this.loadKeyChange(pg, from, to, "added")));
    changes.push(...(await this.loadKeyChange(pg, from, to, "removed")));
    changes!.sort((a, b) => {
      const bdiff = a.blockNumber - b.blockNumber;
      if (bdiff !== 0n) return Number(bdiff);
      const tdiff = a.transactionIndex - b.transactionIndex;
      if (tdiff !== 0) return tdiff;
      return a.logIndex - b.logIndex;
    });
    for (const change of changes) {
      const addr = getAddress(change.address);
      if (this.addrToLogs.get(addr) === undefined) {
        this.addrToLogs.set(addr, []);
      }
      this.addrToLogs.get(addr)!.push(change);

      if (!change.key) throw new Error("[KEY-REG] Invalid event, no key");
      const slot = change.keySlot;
      const derKey = contractFriendlyKeyToDER(change.key);
      switch (change.change) {
        case "added": {
          if (!this.addrToDeploymentTxHash.has(addr)) {
            this.addrToDeploymentTxHash.set(addr, change.transactionHash);
          }
          if (!this.addrToKeyData.has(addr)) {
            this.addrToKeyData.set(addr, []);
          }
          this.addrToKeyData.get(addr)!.push({
            pubKey: derKey,
            addedAt: Number(change.blockNumber),
            slot,
          });
          this.keyToAddr.set(derKey, addr);
          break;
        }
        case "removed": {
          const keyData = this.addrToKeyData.get(addr);
          if (!keyData) throw new Error("[KEY-REG] Invalid event, no key data");
          this.addrToKeyData.set(
            addr,
            keyData.filter((k) => k.pubKey !== derKey)
          );
          this.keyToAddr.delete(derKey);
          break;
        }
      }
      console.log(
        `[KEY-REG] cached ${
          this.addrToKeyData.get(addr)?.length
        } key(s) for ${addr}`
      );
    }
    console.log(
      `[KEY-REG] loaded ${changes.length} key changes in ${
        Date.now() - startTime
      }ms`
    );
    this.listeners.forEach((l) => l(changes));
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
          block_num,
          tx_idx,
          tx_hash,
          log_idx,
          log_addr,
          account,
          key_slot,
          array_agg(key order by abi_idx asc) as key
        from ${table}
        where block_num >= $1 and block_num <= $2
        and chain_id = $3
        group by block_num, tx_idx, tx_hash, log_idx, log_addr, account, key_slot
      `,
      [from, to, chainConfig.chainL2.id]
    );
    return result.rows.map((row) => ({
      change,
      blockNumber: BigInt(row.block_num),
      transactionIndex: row.tx_idx,
      transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
      logIndex: row.log_idx,
      address: getAddress(bytesToHex(row.log_addr, { size: 20 })),
      account: getAddress(bytesToHex(row.account, { size: 20 })),
      keySlot: row.key_slot,
      key: row.key.map((k: Buffer) => bytesToHex(k)) as [Hex, Hex],
    }));
  }

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
