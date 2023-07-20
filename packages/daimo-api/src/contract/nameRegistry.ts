import { NamedAccount, NamedDaimoAccount } from "@daimo/common";
import { ephemeralNotesAddress, nameRegistryConfig } from "@daimo/contract";
import {
  Address,
  Hex,
  Log,
  TransactionReceipt,
  getAbiItem,
  getAddress,
  getContract,
  hexToString,
} from "viem";

import { ContractType, ViemClient } from "../chain";

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
  private accounts: NamedDaimoAccount[] = [];

  contract: ContractType<typeof nameRegistryConfig.abi>;

  constructor(private vc: ViemClient) {
    this.contract = getContract({ ...nameRegistryConfig, ...this.vc });
  }

  /** Init: index logs from chain, get all names so far */
  async init() {
    await this.vc.pipeLogs(
      {
        address: nameRegistryConfig.address,
        event: registeredEvent,
      },
      this.parseLogs
    );

    // Also name a few special addresses
    this.cacheAccount({
      name: "faucet",
      addr: "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7",
    });
    this.cacheAccount({ name: "note", addr: ephemeralNotesAddress });
  }

  /** Parses Registered event logs, first in init(), then on subscription. */
  parseLogs = (logs: RegisteredLog[]) => {
    const accounts = logs
      .map((l) => l.args)
      .filter((a): a is { name: Hex; addr: Hex } => !!(a.name && a.addr))
      .map((a) => ({
        name: hexToString(a.name, { size: 32 }),
        addr: getAddress(a.addr),
      }))
      .filter((a) => isValidName(a.name));
    console.log(`[NAME-REG] parsed ${accounts.length} named account(s)`);

    accounts.forEach(this.cacheAccount);
  };

  /** Cache an account in memory. */
  private cacheAccount = (acc: NamedDaimoAccount) => {
    console.log(`[NAME-REG] caching ${acc.name} -> ${acc.addr}`);
    this.nameToAddr.set(acc.name, acc.addr);
    this.addrToName.set(acc.addr, acc.name);
    this.accounts.push(acc);
  };

  /** Find accounts whose names start with a prefix */
  async search(prefix: string): Promise<NamedDaimoAccount[]> {
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

    const tx = await this.vc.publicClient.waitForTransactionReceipt({
      hash,
    });
    if (tx.status !== "success") throw new Error("Transaction failed");

    // Cache
    this.cacheAccount({ name, addr: address });

    return tx;
  }

  /** Find wallet address for a given Daimo name, or null if not found. */
  resolveName(name: string): Address | undefined {
    return this.nameToAddr.get(name);
  }

  /** Find Daimo name for a given wallet address, or null if not found. */
  resolveAddress(address: Address): string | undefined {
    return this.addrToName.get(address);
  }

  /** Gets name for a given address, if it has one. */
  async getNamedAccount(address: Address): Promise<NamedAccount> {
    const name = await this.resolveAddress(address);
    // TODO: ENS reverse lookup
    return { addr: address, name };
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
