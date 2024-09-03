import {
  KeyData,
  assert,
  assertNotNull,
  contractFriendlyKeyToDER,
  debugJson,
  retryBackoff,
} from "@daimo/common";
import { Kysely } from "kysely";
import { Address, Hex, bytesToHex, getAddress } from "viem";

import { Indexer } from "./indexer";
import { DB as IndexDB } from "../codegen/dbIndex";
import { chainConfig } from "../env";

export interface KeyChange {
  change: "added" | "removed";
  blockNumber: bigint;
  transactionIndex: number;
  transactionHash: Hex;
  logIndex: number;
  address: Address;
  keySlot: number;
  key: [Hex, Hex];
}

export class KeyRegistry extends Indexer {
  private addrToLogs = new Map<Address, KeyChange[]>();

  private keyToAddr = new Map<Hex, Address>();
  private addrToKeyData = new Map<Address, KeyData[]>();
  private addrToDeploymentTxHash = new Map<Address, Hex>();

  private listeners: ((logs: KeyChange[]) => void)[] = [];

  constructor() {
    super("KEY-REG");
  }

  addListener(listener: (logs: KeyChange[]) => void) {
    this.listeners.push(listener);
  }

  async load(kdb: Kysely<IndexDB>, from: number, to: number) {
    const startTime = Date.now();

    const rows = await retryBackoff(`keyRegistry-${from}-${to}`, () =>
      kdb
        .selectFrom("index.daimo_acct_update")
        .selectAll()
        .where("chain_id", "=", "" + chainConfig.chainL2.id)
        .where((eb) => eb.between("block_num", "" + from, "" + to))
        .orderBy("block_num")
        .orderBy("log_idx")
        .execute()
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const changes: KeyChange[] = rows
      .filter((row) => row.key_slot != null)
      .map((row) => ({
        change: (function () {
          if (row.log_name === "SigningKeyAdded") return "added";
          else if (row.log_name === "SigningKeyRemoved") return "removed";
          else throw new Error(`Unexpected key log: ${debugJson(row)}`);
        })(),
        address: getAddress(bytesToHex(row.log_addr)),
        blockNumber: BigInt(row.block_num),
        key: (function () {
          const k = assertNotNull(row.key);
          if (k.length !== 64) throw new Error(`Bad key: ${debugJson(row)}`);
          return [bytesToHex(k.subarray(0, 32)), bytesToHex(k.subarray(32))];
        })(),
        keySlot: assertNotNull(row.key_slot),
        logIndex: Number(row.log_idx),
        transactionHash: bytesToHex(row.tx_hash),
        transactionIndex: Number(row.tx_idx),
      }));

    for (const change of changes) {
      const addr = change.address;
      const addrLogs = this.addrToLogs.get(addr) || [];
      addrLogs.push(change);
      this.addrToLogs.set(addr, addrLogs);

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
          if (keyData == null) {
            console.error("[KEY-REG] ignoring invalid event, no key data");
            break;
          }
          this.addrToKeyData.set(
            addr,
            keyData.filter((k) => k.pubKey !== derKey)
          );
          this.keyToAddr.delete(derKey);
          break;
        }
        default: {
          throw new Error(`Invalid KeyChange: ${debugJson(change)}`);
        }
      }
    }
    if (changes.length === 0) return;

    const elapsedMs = (Date.now() - startTime) | 0;
    console.log(
      `[KEY-REG] loaded ${changes.length} key changes in ${elapsedMs}ms`
    );

    this.listeners.forEach((l) => l(changes));
  }

  /** Find address by DER key */
  async resolveKey(key: Hex): Promise<Address | null> {
    return this.keyToAddr.get(key) || null;
  }

  /** Find all keys and metadata for a daimo account address */
  resolveAddressKeys(addr: Address): KeyData[] | null {
    return this.addrToKeyData.get(addr) || null;
  }

  isDeploymentKeyRotationLog(log: KeyChange) {
    const addr = getAddress(log.address);
    const deploymentTxHash = this.addrToDeploymentTxHash.get(addr);
    assert(deploymentTxHash !== undefined, "No deployment tx hash");
    return log.transactionHash === deploymentTxHash;
  }
}
