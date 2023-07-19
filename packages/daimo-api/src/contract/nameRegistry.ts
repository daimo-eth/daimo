import { DAccount, EAccount } from "@daimo/common";
import { ephemeralNotesAddress, nameRegistryConfig } from "@daimo/contract";
import {
  Address,
  Log,
  TransactionReceipt,
  getAbiItem,
  getAddress,
  hexToString,
} from "viem";

import { KeyRegistry } from "./keyRegistry";
import { NamedAccount } from "../../../daimo-common/src/model";
import { ViemClient } from "../chain";

const registeredName = "Registered";
const registeredEvent = getAbiItem({
  abi: nameRegistryConfig.abi,
  name: registeredName,
});

type RegisteredLog = Log<bigint, number, false, typeof registeredEvent, true>;

const specialAddrLabels: { [_: Address]: string } = {
  "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7": "faucet",
  "0x37Ac8550dA1E8d227266966A0b4925dfae648f7f": "payment link",
};
specialAddrLabels[ephemeralNotesAddress] = "payment link";

/* Interface to the NameRegistry contract. */
export class NameRegistry {
  /* In-memory indexer, for now. */
  private nameToAddr = new Map<string, Address>();
  private addrToName = new Map<Address, string>();
  private accounts: DAccount[] = [];

  keyRegistry: KeyRegistry;

  constructor(private vc: ViemClient, keyRegistry: KeyRegistry) {
    this.keyRegistry = keyRegistry;
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
    await this.keyRegistry.init();
  }

  /** Parses Registered event logs, first in init(), then on subscription. */
  parseLogs = async (logs: RegisteredLog[]) => {
    const accounts = logs
      .map((l) => l.args)
      .map((a) => ({
        name: hexToString(a.name, { size: 32 }),
        addr: getAddress(a.addr),
      }))
      .filter((a) => isValidName(a.name));
    console.log(`[NAME-REG] parsed ${accounts.length} named account(s)`);

    accounts.forEach(this.cacheAccount);
  };

  /** Cache an account in memory. */
  private cacheAccount = (acc: DAccount) => {
    console.log(`[NAME-REG] caching ${acc.name} -> ${acc.addr}`);
    this.nameToAddr.set(acc.name, acc.addr);
    this.addrToName.set(acc.addr, acc.name);
    this.accounts.push(acc);
  };

  /** Find accounts whose names start with a prefix */
  async search(prefix: string): Promise<DAccount[]> {
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
    const nameHex = Buffer.from(name.padEnd(32, "\0")).toString("hex");

    const hash = await this.vc.walletClient.writeContract({
      ...nameRegistryConfig,
      functionName: "register",
      args: [`0x${nameHex}`, address],
    });

    const tx = await this.vc.publicClient.waitForTransactionReceipt({ hash });
    if (tx.status !== "success") throw new Error("Transaction failed");

    this.cacheAccount({ name, addr: address });

    return tx;
  }

  /** Find wallet address for a given Daimo name, or null if not found. */
  resolveName(name: string): Address | undefined {
    return this.nameToAddr.get(name);
  }

  /** Gets an Ethereum account, including name, ENS, label if available. */
  async getEAccount(address: Address): Promise<EAccount> {
    // First, look for a Daimo name
    const name = this.addrToName.get(address);
    if (name) return { addr: address, name };

    // Then, a special labelled address, e.g. faucet
    const label = specialAddrLabels[address];
    if (label) return { addr: address, label };

    // Finally, ENS reverse lookup
    let ensName: string | undefined = undefined;
    try {
      console.log(`[NAME-REG] looking up ENS name for ${address}`);
      ensName = (await this.vc.l1Client.getEnsName({ address })) || undefined;
      console.log(`[NAME-REG] ENS name for ${address}: ${ensName}`);
    } catch (e) {
      console.log(`[NAME-REG] ENS lookup failed for ${address}: ${e}`);
    }

    // Bare addresses are fine too, ensName can be undefined
    return { addr: address, ensName };
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
