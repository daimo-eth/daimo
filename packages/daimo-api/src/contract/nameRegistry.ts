import {
  AddrLabel,
  DAccount,
  DaimoAccountCall,
  EAccount,
  assertEqual,
  assertNotNull,
  bytesToAddr,
  isValidName,
  now,
  retryBackoff,
  validateName,
} from "@daimo/common";
import {
  daimoFastCctpAddrs,
  nameRegistryProxyConfig,
  teamDaimoFaucetAddr,
} from "@daimo/contract";
import { Kysely } from "kysely";
import {
  Address,
  bytesToString,
  encodeFunctionData,
  getAddress,
  isAddress,
} from "viem";
import { normalize } from "viem/ens";

import { Indexer } from "./indexer";
import { ProfileCache } from "../api/profile";
import { DB as IndexDB } from "../codegen/dbIndex";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { InviteGraph } from "../offchain/inviteGraph";

// Special labels are append-only. Historical addresses remain labelled.
export const specialAddrLabels: { [_: Address]: AddrLabel } = {
  // All historical faucet addresses
  "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7": AddrLabel.Faucet,
  // All historical notes ("payment link") contract addresses
  "0x37Ac8550dA1E8d227266966A0b4925dfae648f7f": AddrLabel.PaymentLink,
  "0x450E09fc6C2a9bC4230D4e6f3d7131CCa48b48Ce": AddrLabel.PaymentLink,
  "0x1eec7E083C1a10C16470bEAc7839364853c7B81f": AddrLabel.PaymentLink,
  "0x831967F433D9425Aa34D6A3dAC01a428d839De0f": AddrLabel.PaymentLink,
  "0x4AdcA7cB84497c9c4c308063D2f219C7b6041183": AddrLabel.PaymentLink,
  "0x594bc666500fAeD35DC741F45a35C571399560d8": AddrLabel.PaymentLink,
  "0xfBdb4f1172AaDADdFe4233550e9cD5E4aA1Dae00": AddrLabel.PaymentLink,
  "0xf823d42B543ec9785f973E9Aa3187E42248F4874": AddrLabel.PaymentLink,
  // All historical paymaster addresses
  "0x13f490FafBb206440F25760A10C21A6220017fFa": AddrLabel.Paymaster,
  "0x939263eAFE57038a072cb4edD6B25dd81A8A6c56": AddrLabel.Paymaster,
  "0x0000000000dd6Dd248Ab5487218e1C2D7fbB29c9": AddrLabel.Paymaster,
  // Known Coinbase Pay addresses on Base
  "0x20FE51A9229EEf2cF8Ad9E89d91CAb9312cF3b7A": AddrLabel.Coinbase,
  "0x6dcBCe46a8B494c885D0e7b6817d2b519dF64467": AddrLabel.Coinbase,
  "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87": AddrLabel.Coinbase,
  // Known relay.link address on Base
  "0xf70da97812CB96acDF810712Aa562db8dfA3dbEF": AddrLabel.Relay,
  // Known li.fi addresses on Base
  "0x4DaC9d1769b9b304cb04741DCDEb2FC14aBdF110": AddrLabel.LiFi,
  // Known Uniswap ETH pools on Base
  "0xd0b53D9277642d899DF5C87A3966A349A798F224": AddrLabel.UniswapETHPool,
  "0x6c561B446416E1A00E8E93E221854d6eA4171372": AddrLabel.UniswapETHPool,
  "0xb4CB800910B228ED3d0834cF79D697127BBB00e5": AddrLabel.UniswapETHPool,
  // Known Binance addresses on Base
  "0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A": AddrLabel.Binance,
  // Cross-chain FastCCTP addresses
  "0xAC58C46A40ff5c2cb5e1CD40179CEB8E6207BF0B": AddrLabel.FastCCTP,
  "0x92275f59CEB72DD132de54F726f767ab6ba9559f": AddrLabel.FastCCTP,
};

// Validate that current addresses are correctly recorded.
// This ensures that when they change, we don't forget to update the list.
{
  const s = specialAddrLabels;
  assertEqual(s[teamDaimoFaucetAddr], AddrLabel.Faucet);
  assertEqual(s[chainConfig.pimlicoPaymasterAddress], AddrLabel.Paymaster);
  assertEqual(s[chainConfig.notesV1Address], AddrLabel.PaymentLink);
  assertEqual(s[chainConfig.notesV2Address], AddrLabel.PaymentLink);
  assertEqual(s[chainConfig.uniswapETHPoolAddress], AddrLabel.UniswapETHPool);
  daimoFastCctpAddrs.forEach((a) => assertEqual(s[a], AddrLabel.FastCCTP));
}

// Represents a Daimo name registration.
interface Registration {
  timestamp: number;
  name: string;
  addr: Address;
}

/* Interface to the NameRegistry contract. */
export class NameRegistry extends Indexer {
  /* In-memory indexer, for now. */
  private nameToReg = new Map<string, Registration>();
  private addrToReg = new Map<Address, Registration>();
  private accounts: DAccount[] = [];

  private ensReverseLookups = new Map<Address, Promise<string | undefined>>();

  logs: Registration[] = [];

  constructor(
    private vc: ViemClient,
    private inviteGraph: InviteGraph,
    private profileCache: ProfileCache,
    private nameBlacklist: Set<string>
  ) {
    super("NAME-REG");
  }

  public status() {
    return { numAccounts: this.accounts.length, numLogs: this.logs.length };
  }

  async load(kdb: Kysely<IndexDB>, from: number, to: number) {
    const startMs = performance.now();
    const rows = await retryBackoff(
      `nameRegistry-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("index.daimo_name")
          .selectAll()
          .where("chain_id", "=", "" + chainConfig.chainL2.id)
          .where((eb) => eb.between("block_num", "" + from, "" + to))
          .orderBy("block_num")
          .orderBy("log_idx")
          .execute()
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const names = rows.map((r) => {
      return {
        timestamp: Number(r.block_ts),
        name: bytesToString(r.name, { size: 32 }),
        addr: bytesToAddr(r.addr),
      };
    });
    this.logs.push(...names);
    names.forEach(this.cacheAccount);

    const elapsedMs = (performance.now() - startMs) | 0;
    console.log(`[NAME-REG] loaded ${names.length} names in ${elapsedMs}ms`);
  }

  /** Cache an account in memory. */
  private cacheAccount = (reg: Registration) => {
    if (!isValidName(reg.name)) {
      console.log(`[NAME-REG] skipping invalid name ${reg.name}`);
      return;
    }

    // Ignore if already present
    if (this.accounts.find((a) => a.addr === reg.addr)) {
      return;
    }

    console.log(`[NAME-REG] caching ${reg.name} -> ${reg.addr}`);
    this.nameToReg.set(reg.name, reg);

    if (this.nameBlacklist.has(reg.name)) {
      console.log(`[NAME-REG] hiding blacklisted name ${reg.name}`);
      return;
    }
    this.addrToReg.set(reg.addr, reg);
    this.accounts.push(reg);
  };

  /** Find accounts whose names start with a prefix */
  async search(prefix: string): Promise<DAccount[]> {
    // Slow, linear time search. Replace with DB past a few hundred accounts.
    return this.accounts
      .map((a) => assertNotNull(this.getDaimoAccount(a.addr)))
      .filter(
        (a) =>
          a.name.startsWith(prefix) ||
          (prefix.length > 3 && a.name.includes(prefix))
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);
  }

  /** Get call for registering a Daimo name to an address. */
  getRegisterNameCall(name: string): DaimoAccountCall {
    validateName(name);
    const nameHex = Buffer.from(name.padEnd(32, "\0")).toString("hex");

    return {
      dest: nameRegistryProxyConfig.address,
      value: 0n,
      data: encodeFunctionData({
        abi: nameRegistryProxyConfig.abi,
        functionName: "registerSelf",
        args: [`0x${nameHex}`],
      }),
    };
  }

  /** On successfully registering a name, cache it. */
  onSuccessfulRegister = (name: string, address: Address) => {
    this.cacheAccount({ name, addr: address, timestamp: now() });
  };

  /** Find wallet address for a given Daimo name, or undefined if not found. */
  resolveName(name: string): Address | undefined {
    return this.nameToReg.get(name)?.addr;
  }

  /** Find name, or undefined if not a Daimo account. */
  resolveDaimoNameForAddr(addr: Address): string | undefined {
    return this.addrToReg.get(addr)?.name;
  }

  getDaimoAccount(address: Address): (EAccount & { name: string }) | undefined {
    const reg = this.addrToReg.get(address);
    if (reg == null) return undefined;

    const { addr, name, timestamp } = reg;
    const inviter = this.inviteGraph.getInviter(address);
    const linkedAccounts = this.profileCache.getLinkedAccounts(addr);
    // In the future, we can get this image from multiple sources.
    // In that case, we will have to determine the order of preference.
    const profilePicture = this.profileCache.getProfilePicture(addr);
    return { addr, name, timestamp, inviter, linkedAccounts, profilePicture };
  }

  /** Gets an Ethereum account, including name, ENS, label if available. */
  async getEAccount(address: Address): Promise<EAccount> {
    // First, look for a Daimo name
    const dAcc = this.getDaimoAccount(address);
    if (dAcc) return dAcc;

    // Then, a special labelled address, e.g. faucet
    const label = specialAddrLabels[address];
    if (label) return { addr: address, label };

    // Finally, ENS reverse lookup
    let promise = this.ensReverseLookups.get(address);
    if (promise == null) {
      promise = this.getENSReverseLookup(address);
      this.ensReverseLookups.set(address, promise);
    }
    const ensName = await promise;

    // Bare addresses are fine too, ensName can be undefined
    return { addr: address, ensName };
  }

  async getENSReverseLookup(address: Address): Promise<string | undefined> {
    try {
      console.log(`[NAME-REG] looking up ENS name for ${address}`);
      const ensName = await this.vc.getEnsName({ address });
      if (ensName == null) {
        console.log(`[NAME-REG] no ENS name for ${address}`);
        return undefined;
      }

      // Verify the forward lookup
      const addr = await this.vc.getEnsAddress({ name: ensName });
      if (addr !== address) {
        console.warn(`[NAME-REG] bad ENS ${address} > ${ensName} > ${addr}`);
        return undefined;
      }
      console.log(`[NAME-REG] ENS name for ${address}: ${ensName}`);
      return ensName;
    } catch (e) {
      console.log(`[NAME-REG] ENS lookup failed for ${address}: ${e}`);
      return undefined;
    }
  }

  /** Gets an Ethereum account given "alice", "bob.eth", or "0x..." */
  async getEAccountFromStr(eAccStr: string): Promise<EAccount | undefined> {
    if (eAccStr.includes(".")) {
      const ensName = normalize(eAccStr);
      const addr = await this.vc.getEnsAddress({ name: ensName });
      if (addr != null) {
        return { ensName, addr } as EAccount;
      }
    } else if (isAddress(eAccStr)) {
      const addr = getAddress(eAccStr);
      return await this.getEAccount(addr);
    } else {
      const daimoAddress = this.resolveName(eAccStr);
      if (daimoAddress) {
        return await this.getEAccount(daimoAddress);
      }
    }
  }

  getAllDAccounts() {
    return this.accounts;
  }
}
