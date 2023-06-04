import {
  Account,
  Address,
  Hex,
  TransactionReceipt,
  getAbiItem,
  getContract,
  hexToString,
} from "viem";

import { nameRegistryABI, nameRegistryAddress } from "../gen/contract";
import { publicClient, walletClient } from "./chain";
import { NamedAccount } from "./model";

/* Interface to the NameRegistry contract. */
export class NameRegistry {
  /* In-memory indexer, for now. */
  private nameToAddr = new Map<string, Address>();
  private addrToName = new Map<Address, string>();
  private accounts: NamedAccount[] = [];

  private contract = getContract({
    abi: nameRegistryABI,
    address: nameRegistryAddress,
    publicClient,
    walletClient,
  });

  /** Init: index logs from chain, get all names so far */
  async init() {
    const logs = await publicClient.getLogs({
      address: nameRegistryAddress,
      event: getAbiItem({ abi: nameRegistryABI, name: "Registered" }),
      fromBlock: 0n,
      toBlock: "latest",
    });
    console.log(`Got ${logs.length} logs`);

    logs
      .map((l) => l.args)
      .filter((a): a is { name: Hex; addr: Hex } => !!(a.name && a.addr))
      .map((a) => ({ name: hexToString(a.name), addr: a.addr }))
      .filter((a) => isValidName(a.name))
      .forEach((acc: NamedAccount) => {
        this.nameToAddr.set(acc.name, acc.addr);
        this.addrToName.set(acc.addr, acc.name);
        this.accounts.push(acc);
      });
  }

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
    account: Account,
    name: string,
    address: Address
  ): Promise<TransactionReceipt> {
    validateName(name);
    const bufName = Buffer.from(name.padEnd(32, "\0"));
    const args = [`0x${bufName.toString("hex")}`, address] as const;

    const hash = await this.contract.write.register(args, { account });

    const tx = await publicClient.waitForTransactionReceipt({ hash });
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
