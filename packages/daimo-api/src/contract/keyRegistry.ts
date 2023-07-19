import { accountABI } from "@daimo/contract";
import {
  Account,
  Address,
  BlockTag,
  Chain,
  Hex,
  Log,
  TransactionReceipt,
  Transport,
  WalletClient,
  getAbiItem,
  getContract,
  hexToString,
} from "viem";

import { contractFriendlyKeyToDER } from "./util";
import { KeyData, NamedAccount } from "../../../daimo-common/src/model";
import { ViemClient } from "../chain";

const signingKeyAddedEvent = getAbiItem({
  abi: accountABI,
  name: "SigningKeyAdded",
});
const signingKeyRemovedEvent = getAbiItem({
  abi: accountABI,
  name: "SigningKeyRemoved",
});

type SigningKeyAddedLog = Log<bigint, number, typeof signingKeyAddedEvent>;
type SigningKeyRemovedLog = Log<bigint, number, typeof signingKeyRemovedEvent>;
type SigningKeyAddedOrRemovedLog = SigningKeyAddedLog | SigningKeyRemovedLog;

export class KeyRegistry {
  /* In-memory indexer, for now. */
  private keyToAddr = new Map<Hex, Address>();
  private addrToLogs = new Map<Address, SigningKeyAddedOrRemovedLog[]>();
  private addrToKeyData = new Map<Address, KeyData[]>();

  constructor(private vc: ViemClient) {}

  async init() {
    await this.vc.pipeLogs(
      {
        event: signingKeyAddedEvent,
      },
      this.parseLogs
    );

    await this.vc.pipeLogs(
      {
        event: signingKeyRemovedEvent,
      },
      this.parseLogs
    );
    console.log(`[KEY-REG] watching logs`);
  }

  /** Parses a particular account's event logs, first in name registries init(), then on subscription. */
  parseLogs = async (logs: SigningKeyAddedOrRemovedLog[]) => {
    const currentBlockNumber = await this.vc.publicClient.getBlockNumber(); // TODO?
    for (const log of logs) {
      const addr = log.address;
      if (this.addrToLogs.get(addr) === undefined) {
        this.addrToLogs.set(addr, []);
      }
      this.addrToLogs.get(addr)!.push(...logs);
      this.cacheAddressProperties(addr, currentBlockNumber);
    }
  };

  /** Cache an address's key properties in memory. */
  cacheAddressProperties = (addr: Address, currentBlockNumber: bigint) => {
    // deterministically sort all logs
    const sortedLogs = this.addrToLogs.get(addr)!.sort((a, b) => {
      const aBlockNumber = a.blockNumber || currentBlockNumber + 1n;
      const bBlockNumber = b.blockNumber || currentBlockNumber + 1n;
      if (aBlockNumber < bBlockNumber) return -1;
      if (aBlockNumber > bBlockNumber) return 1;
      else {
        const aLogIndex = a.logIndex || Infinity;
        const bLogIndex = b.logIndex || Infinity;
        if (aLogIndex < bLogIndex) return -1;
        if (aLogIndex > bLogIndex) return 1;
        else return 0;
      }
    });

    const currentKeyData: Map<string, KeyData> = new Map();
    for (const log of sortedLogs) {
      if (!log.args.accountPubkey)
        throw new Error("[API] Invalid event, no accountPubkey");
      const derKey = contractFriendlyKeyToDER(log.args.accountPubkey);
      if (log.eventName === "SigningKeyAdded") {
        currentKeyData.set(derKey, {
          key: derKey,
          addedAt: Number(log.blockNumber || currentBlockNumber + 1n),
        });
      } else if (log.eventName === "SigningKeyRemoved") {
        currentKeyData.set(derKey, {
          ...currentKeyData.get(derKey)!,
          removedAt: Number(log.blockNumber || currentBlockNumber + 1n),
        });
      }
    }

    this.addrToKeyData.set(addr, [...currentKeyData.values()]);

    for (const keyData of currentKeyData.values()) {
      this.keyToAddr.set(keyData.key, addr);
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
}
