import {
  AddrLabel,
  DAccount,
  DaimoAccountCall,
  EAccount,
  isValidName,
  validateName,
} from "@daimo/common";
import {
  ephemeralNotesAddress,
  nameRegistryABI,
  nameRegistryAddress,
  nameRegistryConfig,
} from "@daimo/contract";
import {
  Address,
  Log,
  encodeFunctionData,
  getAbiItem,
  getAddress,
  hexToString,
} from "viem";

import { ViemClient } from "../chain";

const registeredName = "Registered";
const registeredEvent = getAbiItem({
  abi: nameRegistryConfig.abi,
  name: registeredName,
});

type RegisteredLog = Log<bigint, number, false, typeof registeredEvent, true>;

const specialAddrLabels: { [_: Address]: AddrLabel } = {
  "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7": AddrLabel.Faucet,
  "0x37Ac8550dA1E8d227266966A0b4925dfae648f7f": AddrLabel.PaymentLink,
};
specialAddrLabels[ephemeralNotesAddress] = AddrLabel.PaymentLink;

/* Interface to the NameRegistry contract. */
export class NameRegistry {
  /* In-memory indexer, for now. */
  private nameToAddr = new Map<string, Address>();
  private addrToName = new Map<Address, string>();
  private accounts: DAccount[] = [];

  constructor(private vc: ViemClient) {}

  /** Init: index logs from chain, get all names so far */
  async init() {
    await this.vc.pipeLogs(
      {
        address: nameRegistryConfig.address,
        event: registeredEvent,
      },
      this.parseLogs
    );
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

  /** Get call for registering a Daimo name to an address. */
  getRegisterNameCall(name: string): DaimoAccountCall {
    validateName(name);
    const nameHex = Buffer.from(name.padEnd(32, "\0")).toString("hex");

    return {
      dest: nameRegistryAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: nameRegistryABI,
        functionName: "registerSelf",
        args: [`0x${nameHex}`],
      }),
    };
  }

  /** On successfully registering a name, cache it. */
  onSuccessfulRegister = (name: string, address: Address) => {
    this.cacheAccount({ name, addr: address });
  };

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
