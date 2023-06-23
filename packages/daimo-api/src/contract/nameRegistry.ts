import { nameRegistryConfig } from "@daimo/contract";
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

import { ClientsType, ContractType, getClients } from "../chain";
import { NamedAccount } from "../model";

const registeredName = "Registered";
const registeredEvent = getAbiItem({
  abi: nameRegistryConfig.abi,
  name: registeredName,
});

type RegisteredLog = Log<bigint, number, typeof registeredEvent>;

/* Interface to the NameRegistry contract. */
export class NameRegistry {
  /* In-memory indexer, for now. */
  private nameToAddr = new Map<string, Address>();
  private addrToName = new Map<Address, string>();
  private accounts: NamedAccount[] = [];

  clients: ClientsType;
  contract: ContractType<typeof nameRegistryConfig.abi>;

  constructor(walletClient: WalletClient<Transport, Chain, Account>) {
    this.clients = getClients(walletClient);
    this.contract = getContract({ ...nameRegistryConfig, ...this.clients });
  }

  /** Init: index logs from chain, get all names so far */
  async init() {
    const logs = await this.clients.publicClient.getLogs({
      address: nameRegistryConfig.address,
      event: registeredEvent,
      fromBlock: 0n,
      toBlock: "latest" as BlockTag,
    });
    console.log(`[NAME-REG] init, read ${logs.length} logs`);
    this.parseLogs(logs);

    this.clients.publicClient.watchContractEvent({
      ...nameRegistryConfig,
      eventName: registeredName,
      onLogs: (logs: RegisteredLog[]) => {
        console.log(`[NAME-REG] subscribe, ${logs.length} new logs`);
        this.parseLogs(logs);
      },
    });
  }

  /** Parses Registered event logs, first in init(), then on subscription. */
  parseLogs = (logs: RegisteredLog[]) => {
    const accounts = logs
      .map((l) => l.args)
      .filter((a): a is { name: Hex; addr: Hex } => !!(a.name && a.addr))
      .map((a) => ({ name: hexToString(a.name, { size: 32 }), addr: a.addr }))
      .filter((a) => isValidName(a.name));
    console.log(`[NAME-REG] parsed ${accounts.length} named account(s)`);

    accounts.forEach(this.cacheAccount);
  };

  /** Cache an account in memory. */
  cacheAccount = (acc: NamedAccount) => {
    this.nameToAddr.set(acc.name, acc.addr);
    this.addrToName.set(acc.addr, acc.name);
    this.accounts.push(acc);
  };

  /** Find accounts whose names start with a prefix */
  async search(prefix: string): Promise<NamedAccount[]> {
    // Slow, linear time search. Replace with DB past a few hundred accounts.
    return this.accounts
      .filter((a) => a.name.startsWith(prefix))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);
  }

  /** Registers a Daimo name to an address. */
  async registerName(
    name: string,
    address: Address
  ): Promise<TransactionReceipt> {
    validateName(name);
    const bufName = Buffer.from(name.padEnd(32, "\0"));
    const args = [`0x${bufName.toString("hex")}`, address] as const;

    const hash = await this.contract.write.register(args);

    const tx = await this.clients.publicClient.waitForTransactionReceipt({
      hash,
    });
    if (tx.status !== "success") throw new Error("Transaction failed");

    // Cache
    this.cacheAccount({ name, addr: address });

    return tx;
  }

  /** Find wallet address for a given Daimo name, or null if not found. */
  async resolveName(name: string): Promise<Address | null> {
    return this.nameToAddr.get(name) || null;
  }

  /** Find Daimo name for a given wallet address, or null if not found. */
  async resolveAddress(address: Address): Promise<string | null> {
    return this.addrToName.get(address) || null;
  }
}

export function isValidName(name: string): boolean {
  return /^[a-z][a-z0-9]{2,31}$/.test(name);
}

export function validateName(name: string): string {
  if (name.length < 3) throw new Error("Too short");
  if (name.length > 32) throw new Error("Too long");
  if (!isValidName(name)) throw new Error("Lowercase letters and numbers only");
  return name;
}
