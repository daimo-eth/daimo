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
import { NamedAccount } from "../../../daimo-common/src/model";
import { ViemClient } from "../chain";

type KeyData = {
  key: Hex; // DER format
  addedAt: bigint;
  removedAt?: bigint;
  // TODO lastUsedAt?: bigint;
};

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
  private keyToAccount = new Map<Hex, NamedAccount>();
  private addrToLogs = new Map<Address, SigningKeyAddedOrRemovedLog[]>();
  private addrToKeyData = new Map<Address, KeyData[]>();

  constructor(private vc: ViemClient) {}

  /** Init: index logs from chain, get all events so far */
  async watchAccount(acc: NamedAccount) {
    const addedLogs = await this.vc.publicClient.getLogs({
      address: acc.addr,
      event: signingKeyAddedEvent,
      fromBlock: 0n,
      toBlock: "latest" as BlockTag,
    });
    const removedLogs = await this.vc.publicClient.getLogs({
      address: acc.addr,
      event: signingKeyRemovedEvent,
      fromBlock: 0n,
      toBlock: "latest" as BlockTag,
    });
    console.log(
      `[KEY-REG] watching ${acc.name}, read ${addedLogs.length} SigningKeyAdded logs, ${removedLogs.length} SigningKeyRemoved logs`
    );

    const currentBlock = await this.vc.publicClient.getBlockNumber();
    this.parseLogs(acc, currentBlock, [...addedLogs, ...removedLogs]);

    this.vc.publicClient.watchContractEvent({
      address: acc.addr,
      abi: accountABI,
      eventName: "SigningKeyAdded",
      onLogs: async (logs: SigningKeyAddedLog[]) => {
        console.log(
          `[KEY-REG] subscribe ${acc.name}, ${logs.length} new SigningKeyAdded logs`
        );
        const currentBlock = await this.vc.publicClient.getBlockNumber();
        this.parseLogs(acc, currentBlock, logs);
      },
    });

    this.vc.publicClient.watchContractEvent({
      address: acc.addr,
      abi: accountABI,
      eventName: "SigningKeyRemoved",
      onLogs: async (logs: SigningKeyRemovedLog[]) => {
        console.log(
          `[KEY-REG] subscribe ${acc.name}, ${logs.length} new SigningKeyRemoved logs`
        );
        const currentBlock = await this.vc.publicClient.getBlockNumber();
        this.parseLogs(acc, currentBlock, logs);
      },
    });
  }

  /** Parses a particular account's event logs, first in name registries init(), then on subscription. */
  parseLogs = (
    acc: NamedAccount,
    currentBlockNumber: bigint,
    logs: SigningKeyAddedOrRemovedLog[]
  ) => {
    if (this.addrToLogs.get(acc.addr) === undefined) {
      this.addrToLogs.set(acc.addr, []);
    }
    this.addrToLogs.get(acc.addr)!.push(...logs);

    // deterministically sort all logs
    const sortedLogs = this.addrToLogs.get(acc.addr)!.sort((a, b) => {
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

    this.addrToLogs.set(acc.addr, sortedLogs);
    this.cacheAccountProperties(acc, currentBlockNumber);
  };

  /** Cache an account's properties in memory. */
  cacheAccountProperties = (acc: NamedAccount, currentBlockNumber: bigint) => {
    const currentKeyData: Map<string, KeyData> = new Map();
    for (const log of this.addrToLogs.get(acc.addr)!) {
      if (!log.args.accountPubkey)
        throw new Error("[API] Invalid event, no accountPubkey");
      const derKey = contractFriendlyKeyToDER(log.args.accountPubkey);
      if (log.eventName === "SigningKeyAdded") {
        currentKeyData.set(derKey, {
          key: derKey,
          addedAt: log.blockNumber || currentBlockNumber + 1n,
        });
      } else if (log.eventName === "SigningKeyRemoved") {
        currentKeyData.set(derKey, {
          ...currentKeyData.get(derKey)!,
          removedAt: log.blockNumber || currentBlockNumber + 1n,
        });
      }
    }

    this.addrToKeyData.set(acc.addr, [...currentKeyData.values()]);

    for (const keyData of currentKeyData.values()) {
      this.keyToAccount.set(keyData.key, acc);
    }
  };

  /** Find daimo account by DER key */
  async resolveKey(key: Hex): Promise<NamedAccount | null> {
    return this.keyToAccount.get(key) || null;
  }

  /** Find all keys and metadata for a daimo account address */
  async resolveAddressKeys(addr: Address): Promise<KeyData[] | null> {
    return this.addrToKeyData.get(addr) || null;
  }
}
