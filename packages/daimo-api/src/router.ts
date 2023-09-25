import {
  DaimoAccountCall,
  DaimoRequestStatus,
  EAccount,
  dollarsToAmount,
  hasAccountName,
  parseDaimoLink,
  zAddress,
  zHex,
} from "@daimo/common";
import {
  ephemeralNotesAddress,
  erc20ABI,
  tokenMetadata,
} from "@daimo/contract";
import { DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { Address, encodeFunctionData, getAddress } from "viem";
import { normalize } from "viem/ens";
import { z } from "zod";

import { ViemClient } from "./chain";
import { AccountFactory } from "./contract/accountFactory";
import { CoinIndexer } from "./contract/coinIndexer";
import { Faucet } from "./contract/faucet";
import { KeyRegistry } from "./contract/keyRegistry";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { OpIndexer } from "./contract/opIndexer";
import { Paymaster } from "./contract/paymaster";
import { PushNotifier } from "./pushNotifier";
import { publicProcedure, router } from "./trpc";

export function createRouter(
  vc: ViemClient,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
  opIndexer: OpIndexer,
  nameReg: NameRegistry,
  keyReg: KeyRegistry,
  paymaster: Paymaster,
  faucet: Faucet,
  notifier: PushNotifier,
  accountFactory: AccountFactory
) {
  return router({
    search: publicProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async (opts) => {
        const { prefix } = opts.input;

        // Search for "vitalik" or "vitalik.eth" matches vitalik.eth
        // Search for "jesse.cb.id" matches jesse.cb.id
        async function tryGetEnsAddr() {
          if (prefix.length < 3) return null;
          try {
            const ensName = normalize(
              prefix.includes(".") ? prefix : prefix + ".eth"
            );
            const addr = await vc.l1Client.getEnsAddress({ name: ensName });
            if (addr == null) return null;
            return { ensName, addr } as EAccount;
          } catch (e) {
            console.log(`[API] ens lookup '{ensName}' failed: ${e}`);
            return null;
          }
        }

        const ret: EAccount[] = [];
        const [daimoAccounts, ensAccount] = await Promise.all([
          nameReg.search(prefix),
          tryGetEnsAddr(),
        ]);
        ret.push(...daimoAccounts);
        if (ensAccount) {
          let insertAt = 0;
          if (ret[0] && ret[0].name === prefix) insertAt = 1;
          ret.splice(insertAt, 0, ensAccount);
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

        async function getEAccountFromStr(eAccStr: string): Promise<EAccount> {
          const ret = await nameReg.getEAccountFromStr(eAccStr);
          if (ret == null) throw new Error(`${eAccStr} not found`);
          return ret;
        }

        switch (link.type) {
          case "account": {
            const acc = await getEAccountFromStr(link.account);
            return { link, account: acc };
          }
          case "request": {
            const acc = await getEAccountFromStr(link.recipient);

            // Check if already fulfilled
            const fulfilledNonceMetadata = new DaimoNonceMetadata(
              DaimoNonceType.RequestResponse,
              BigInt(link.requestId)
            );
            const potentialFulfillTxes = opIndexer.fetchTxHashes(
              fulfilledNonceMetadata
            );
            const relevantTransfers = coinIndexer.filterTransfers({
              addr: acc.addr,
              txHashes: potentialFulfillTxes,
            });
            const expectedAmount = dollarsToAmount(parseFloat(link.dollars));
            const fulfillTxes = relevantTransfers.filter(
              (t) => t.to === acc.addr && BigInt(t.amount) === expectedAmount
            );
            const fulfilledBy =
              fulfillTxes.length > 0
                ? await nameReg.getEAccount(fulfillTxes[0].from)
                : undefined;

            const ret: DaimoRequestStatus = {
              link,
              recipient: acc,
              requestId: link.requestId,
              fulfilledBy,
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

    lookupEthereumAccountByKey: publicProcedure
      .input(
        z.object({
          pubKeyHex: zHex,
        })
      )
      .query(async (opts) => {
        const addr = await keyReg.resolveKey(opts.input.pubKeyHex);
        return addr ? await nameReg.getEAccount(addr) : null;
      }),

    lookupAddressKeys: publicProcedure
      .input(z.object({ addr: zAddress }))
      .query(async (opts) => {
        const { addr } = opts.input;
        return await keyReg.resolveAddressKeys(addr);
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
        console.log(`[API] getAccountHist: ${address} since ${sinceBlockNum}`);

        // Get latest finalized block. Next account sync, fetch since this block.
        const finBlock = await vc.publicClient.getBlock({
          blockTag: "finalized",
        });
        if (finBlock.number == null) throw new Error("No finalized block");
        if (finBlock.number < sinceBlockNum) {
          console.log(
            `[API] getAccountHist: OLD final block ${finBlock.number} < ${sinceBlockNum}`
          );
        }

        // Get the latest block + current balance.
        const lastBlk = vc.getLastBlock();
        if (lastBlk == null) throw new Error("No latest block");
        const lastBlock = Number(lastBlk.number);
        const lastBlockTimestamp = Number(lastBlk.timestamp);
        const lastBalance = await coinIndexer.getBalanceAt(address, lastBlock);

        // TODO: get userops, including reverted ones. Show failed sends.

        // Get successful transfers since sinceBlockNum
        const transferLogs = coinIndexer.filterTransfers({
          addr: address,
          sinceBlockNum: BigInt(sinceBlockNum),
        });

        console.log(
          `[API] getAccountHist: ${transferLogs.length} logs for ${address} since ${sinceBlockNum}`
        );

        // Get named accounts
        const addrs = new Set<Address>();
        transferLogs.forEach((log) => {
          addrs.add(log.from);
          addrs.add(log.to);
        });
        const namedAccounts = (
          await Promise.all([...addrs].map((addr) => nameReg.getEAccount(addr)))
        ).filter((acc) => hasAccountName(acc));

        // Get account keys
        const accountKeys = await keyReg.resolveAddressKeys(address);

        const chainGasConstants = await paymaster.calculateChainGasConstants();

        return {
          address,

          lastFinalizedBlock: Number(finBlock.number),
          lastBlock,
          lastBlockTimestamp,
          lastBalance: String(lastBalance),

          chainGasConstants,

          transferLogs,
          namedAccounts,
          accountKeys,
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

        const maxUint256 = 2n ** 256n - 1n;
        const initCalls: DaimoAccountCall[] = [
          {
            // Approve notes contract infinite spending on behalf of the account
            dest: tokenMetadata.address,
            value: 0n,
            data: encodeFunctionData({
              abi: erc20ABI,
              functionName: "approve",
              args: [ephemeralNotesAddress, maxUint256],
            }),
          },
          {
            // Approve paymaster contract infinite spending on behalf of the account
            dest: tokenMetadata.address,
            value: 0n,
            data: encodeFunctionData({
              abi: erc20ABI,
              functionName: "approve",
              args: [tokenMetadata.paymasterAddress, maxUint256],
            }),
          },
          nameReg.getRegisterNameCall(name), // Register name
        ];

        // TODO: put a check for the counterfactual address on client side so the server is not trusted.
        const address = await accountFactory.getAddress(pubKeyHex, initCalls);

        // We use paymaster now, not needed.
        // TODO: delete code.
        const value = 0n;

        console.log(`[API] Deploying account for ${name}, address ${address}`);
        const deployReceipt = await accountFactory.deploy(
          pubKeyHex,
          initCalls,
          value
        ); // Deploy account

        if (deployReceipt.status !== "success") {
          return { status: deployReceipt.status, address: undefined };
        }

        nameReg.onSuccessfulRegister(name, address);
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
