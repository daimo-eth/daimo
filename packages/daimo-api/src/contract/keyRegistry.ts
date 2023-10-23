import { KeyData, contractFriendlyKeyToDER } from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import { Address, Hex, Log, getAbiItem, getAddress } from "viem";

import { ViemClient } from "../env";

const signingKeyAddedEvent = getAbiItem({
  abi: daimoAccountABI,
  name: "SigningKeyAdded",
});
const signingKeyRemovedEvent = getAbiItem({
  abi: daimoAccountABI,
  name: "SigningKeyRemoved",
});

type SigningKeyAddedLog = Log<
  bigint,
  number,
  false,
  typeof signingKeyAddedEvent,
  true
>;
type SigningKeyRemovedLog = Log<
  bigint,
  number,
  false,
  typeof signingKeyRemovedEvent,
  true
>;
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

  /** Parses account key add/remove logs, first on init() and then on subscription. */
  parseLogs = (logs: SigningKeyAddedOrRemovedLog[]) => {
    const addrToNewLogs: Map<Address, SigningKeyAddedOrRemovedLog[]> =
      new Map();
    for (const log of logs) {
      const addr = getAddress(log.address);
      const logs = addrToNewLogs.get(addr) || [];
      addrToNewLogs.set(addr, logs.concat([log]));
    }

    for (const addr of addrToNewLogs.keys()) {
      const newLogs = addrToNewLogs.get(addr)!;
      if (this.addrToLogs.get(addr) === undefined) {
        this.addrToLogs.set(addr, []);
      }
      this.addrToLogs.get(addr)!.push(...newLogs);

      this.cacheAddressProperties(addr);
    }
  };

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
      if (!log.args.key) throw new Error("[API] Invalid event, no key");
      const slot = log.args.keySlot;
      const derKey = contractFriendlyKeyToDER(log.args.key);

      if (log.eventName === "SigningKeyAdded") {
        currentKeyData.set(derKey, {
          pubKey: derKey,
          addedAt: Number(log.blockNumber),
          slot,
        });
      } else if (log.eventName === "SigningKeyRemoved") {
        currentKeyData.set(derKey, {
          ...currentKeyData.get(derKey)!,
          removedAt: Number(log.blockNumber),
        });
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
}
