import {
  DAccount,
  DaimoRequestStatus,
  TransferLogSummary,
  hasAccountName,
  parseDaimoLink,
  zAddress,
  zHex,
} from "@daimo/common";
import { Address, PublicClient, Transport, getAddress } from "viem";
import { baseGoerli } from "viem/chains";
import { normalize } from "viem/ens";
import { z } from "zod";

import { AccountFactory } from "./contract/accountFactory";
import { CoinIndexer } from "./contract/coinIndexer";
import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { PushNotifier } from "./pushNotifier";
import { publicProcedure, router } from "./trpc";

export function createRouter(
  l1Client: PublicClient,
  l2Client: PublicClient<Transport, typeof baseGoerli>,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
  entryPoint: EntryPoint,
  nameReg: NameRegistry,
  faucet: Faucet,
  notifier: PushNotifier,
  accountFactory: AccountFactory
) {
  return router({
    search: publicProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async (opts) => {
        const { prefix } = opts.input;

        // TODO: replace "DAccount" with EAccount/DAccount
        // Search for "vitalik" or "vitalik.eth" matches vitalik.eth
        // Search for "jesse.cb.id" matches jesse.cb.id
        async function tryGetEnsAddr() {
          if (prefix.length < 3) return null;
          try {
            const ensName = normalize(
              prefix.includes(".") ? prefix : prefix + ".eth"
            );
            return {
              name: ensName,
              addr: await l1Client.getEnsAddress({ name: ensName }),
            } as DAccount; // TODO: EAccount
          } catch (e) {
            console.log(`[API] ens lookup '{ensName}' failed: ${e}`);
            return null;
          }
        }

        const [ret, ens] = await Promise.all([
          nameReg.search(prefix),
          tryGetEnsAddr(),
        ]);
        if (ens) {
          let insertAt = 0;
          if (ret[0] && ret[0].name === prefix) insertAt = 1;
          ret.splice(insertAt, 0, ens);
        }

        console.log(`[API] search: ${ret.length} results for '${prefix}'`);
        return ret;
      }),

    resolveName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async (opts) => {
        const { name } = opts.input;
        return nameReg.resolveName(name) || null;
      }),

    // DEPRECATED
    resolveAddr: publicProcedure
      .input(z.object({ addr: zAddress }))
      .query(async (opts) => {
        const addr = getAddress(opts.input.addr);
        return (await nameReg.getEAccount(addr)).name || null;
      }),

    getEthereumAccount: publicProcedure
      .input(z.object({ addr: zAddress }))
      .query(async (opts) => {
        const addr = getAddress(opts.input.addr);
        return nameReg.getEAccount(addr) || null;
      }),

    getLinkStatus: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(async (opts) => {
        const { url } = opts.input;

        const link = parseDaimoLink(url);
        if (link == null) {
          throw new Error(`Invalid Daimo app link: ${url}`);
        }

        switch (link.type) {
          case "request": {
            const acc = await nameReg.getEAccount(link.recipient);
            if (acc.name == null) {
              throw new Error(`Not found: ${link.recipient}`);
            }
            const ret: DaimoRequestStatus = {
              link,
              recipient: acc,
            };
            return ret;
          }

          case "note": {
            const ret = await noteIndexer.getNoteStatus(link.ephemeralOwner);
            return ret;
          }

          default:
            throw new Error(`Invalid Daimo app link: ${url}`);
        }
      }),

    lookupAccountByKey: publicProcedure
      .input(
        z.object({
          pubKeyHex: zHex,
        })
      )
      .query(async (opts) => {
        const ret = null as DAccount | null;
        // TODO: lookup account by signing key
        console.log(
          `[API] lookup found ${ret?.name || "<no account>"} for pubkey ${
            opts.input.pubKeyHex
          }`
        );
        return ret;
      }),

    getAccountHistory: publicProcedure
      .input(
        z.object({
          address: zAddress,
          sinceBlockNum: z.number(),
        })
      )
      .query(async (opts) => {
        const { sinceBlockNum } = opts.input;
        const address = getAddress(opts.input.address);

        // Get latest finalize block. Future account sync will be since that.
        const finBlock = await l2Client.getBlock({ blockTag: "finalized" });
        if (finBlock.number == null) throw new Error("No finalized block");
        if (finBlock.number < sinceBlockNum) {
          console.log(
            `[API] getAccountHist: OLD final block ${finBlock.number} < ${sinceBlockNum}`
          );
        }

        // Get the latest block + current balance.
        const lastBlk = await l2Client.getBlock({ blockTag: "latest" });
        if (lastBlk.number == null) throw new Error("No latest block");
        const lastBlock = Number(lastBlk.number);
        const lastBlockTimestamp = Number(lastBlk.timestamp);
        const lastBalance = await coinIndexer.getBalanceAt(address, lastBlock);

        const rawLogs = coinIndexer.filterTransfers({
          addr: address,
          sinceBlockNum: BigInt(sinceBlockNum),
        });

        console.log(
          `[API] getAccountHist: ${rawLogs.length} logs for ${address} since ${sinceBlockNum}`
        );

        const transferLogs = rawLogs.map((log) => {
          const { blockNumber, blockHash, logIndex, transactionHash } = log;
          const { from, to, value } = log.args;

          if (
            blockNumber == null ||
            blockHash == null ||
            logIndex == null ||
            transactionHash == null
          ) {
            throw new Error(`pending log ${JSON.stringify(log)}`);
          }

          return {
            from,
            to,
            amount: `${value}`,
            blockNum: Number(blockNumber),
            blockHash,
            txHash: transactionHash,
            logIndex,
          } as TransferLogSummary;
        });

        // Get named accounts
        const addrs = new Set<Address>();
        transferLogs.forEach((log) => {
          addrs.add(log.from);
          addrs.add(log.to);
        });
        const namedAccounts = (
          await Promise.all([...addrs].map((addr) => nameReg.getEAccount(addr)))
        ).filter((acc) => hasAccountName(acc));

        return {
          address,

          lastFinalizedBlock: Number(finBlock.number),
          lastBlock,
          lastBlockTimestamp,
          lastBalance: String(lastBalance),

          transferLogs,
          namedAccounts,
        };
      }),

    registerPushToken: publicProcedure
      .input(
        z.object({
          address: zAddress,
          token: z.string(),
        })
      )
      .mutation(async (opts) => {
        // TODO: device attestation or validate token to avoid griefing
        // Auth is not for privacy; anyone can watch an address onchain.
        const { token } = opts.input;
        const address = getAddress(opts.input.address);
        notifier.register(address, token);
      }),

    deployWallet: publicProcedure
      .input(
        z.object({
          name: z.string(),
          pubKeyHex: zHex,
        })
      )
      .mutation(async (opts) => {
        const { name, pubKeyHex } = opts.input;

        const address = await accountFactory.getAddress(pubKeyHex);

        // TODO: Should be able to batch these in a single tx for perf.
        // Promise.all awaiting doesn't work because nonces go out of sync.

        console.log(`[API] Deploying account for ${name}, pubkey ${pubKeyHex}`);
        const deployReceipt = await accountFactory.deploy(pubKeyHex); // Deploy account

        console.log(`[API] Registering name ${name} at ${address}`);
        const registerReceipt = await nameReg.registerName(name, address); // Register name

        console.log(`[API] Prefunding ${address}`);
        const prefundReceipt = await entryPoint.prefundEth(
          address,
          BigInt(5e16)
        ); // Prepay gas, 0.05 ETH

        if (deployReceipt.status !== "success") {
          return { status: deployReceipt.status, address: undefined };
        }
        if (registerReceipt.status !== "success") {
          return { status: registerReceipt.status, address: undefined };
        }
        if (prefundReceipt.status !== "success") {
          return { status: prefundReceipt.status, address: undefined };
        }
        return { status: "success", address };
      }),

    testnetFaucetStatus: publicProcedure
      .input(z.object({ recipient: zAddress }))
      .query(async (opts) => {
        const recipient = getAddress(opts.input.recipient);
        return faucet.getStatus(recipient);
      }),

    testnetRequestFaucet: publicProcedure
      .input(z.object({ recipient: zAddress }))
      .mutation(async (opts) => {
        const recipient = getAddress(opts.input.recipient);
        return faucet.request(recipient);
      }),
  });
}
