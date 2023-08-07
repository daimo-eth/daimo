import {
  DaimoRequestStatus,
  DAccount,
  TransferLogSummary,
  parseDaimoLink,
  zAddress,
  zHex,
  hasAccountName,
} from "@daimo/common";
import { DaimoAccount } from "@daimo/userop";
import { Address, PublicClient, getAddress } from "viem";
import { normalize } from "viem/ens";
import { z } from "zod";

import { CoinIndexer } from "./contract/coinIndexer";
import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { PushNotifier } from "./pushNotifier";
import { publicProcedure, router } from "./trpc";

export function createRouter(
  l1Client: PublicClient,
  l2Client: PublicClient,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
  entryPoint: EntryPoint,
  nameReg: NameRegistry,
  faucet: Faucet,
  notifier: PushNotifier
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
        // TODO: lookup account by signing key
        // Doing this efficiently likely requires an AddKey event
        // Alternately, an indexer contract thru which all accounts are deployed
        let ret = null as DAccount | null;

        // Stub to test client
        if (
          opts.input.pubKeyHex ===
          "0x3059301306072a8648ce3d020106082a8648ce3d03010703420004fea4465280cfcb1e1b77a91525ca90dfdd213705b6eac7bc7a79931af4e0cfe7464564a11e15252f840d73da0d34fddb74ebe806e93840f3c208e68d620d7376"
        ) {
          ret = {
            name: "test",
            addr: "0xa3449c3f57af6d39bc9eb41d6e0b75d3723210cd",
          };
        } else if (
          opts.input.pubKeyHex ===
          `0x3059301306072a8648ce3d020106082a8648ce3d0301070342000436dff9029e718c4c7da071077a53a987569ecc780f92203e26afc7b91e1362582ce0bfc65b7cef65dff64768978e691eca8576da6f9d387fe77c70eeaed26f33`
        ) {
          ret = {
            name: "jules",
            addr: "0xbfbff790707f8a9bddae662985270df58011cd9c",
          };
        }

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

        // Don't deploy the account; just get the counterfactual address
        console.log(
          `[API] not deploying account for ${name}, pubkey ${pubKeyHex}`
        );
        const account = await DaimoAccount.init(
          l2Client,
          pubKeyHex,
          () => {
            throw new Error("No signer");
          },
          false
        );
        const address = account.getAddress();

        // Prepay gas for the account
        await entryPoint.prefundEth(address, BigInt(5e16)); // 0.05 ETH

        // Register name
        const registerReceipt = await nameReg.registerName(name, address);
        const { status } = registerReceipt;
        console.log(`[API] register name ${name} at ${address}: ${status}`);
        return { status, address };
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
