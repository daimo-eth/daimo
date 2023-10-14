import {
  DaimoNoteStatus,
  DaimoRequestStatus,
  EAccount,
  dollarsToAmount,
  hasAccountName,
  parseDaimoLink,
  zAddress,
  zHex,
} from "@daimo/common";
import { DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { Address, getAddress } from "viem";
import { normalize } from "viem/ens";
import { z } from "zod";

import { deployWallet } from "./api/deployWallet";
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
import { Telemetry } from "./telemetry";
import { trpcT } from "./trpc";

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
  accountFactory: AccountFactory,
  telemetry: Telemetry
) {
  // TODO: tracer doesn't work.
  // https://github.com/honeycombio/honeycomb-opentelemetry-node/issues/239
  // const tracer = trace.getTracer("daimo-api");

  const tracerMiddleware = trpcT.middleware(async (opts) => {
    // const span = tracer.startSpan(`trpc.${opts.type}`);
    // span.setAttributes({ "trpc.path": opts.path });
    const startMs = performance.now();

    const result = await opts.next();

    const endMs = performance.now();
    telemetry.recordRpc(opts.ctx, opts.path, result.ok, endMs - startMs);
    // const code = result.ok ? SpanStatusCode.OK : SpanStatusCode.ERROR;
    // span.setStatus({ code });
    // span.end();

    return result;
  });

  const publicProcedure = trpcT.procedure.use(tracerMiddleware);

  return trpcT.router({
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
            console.log(`[API] ens lookup '${prefix}' failed: ${e}`);
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
            if (ret == null) {
              const sender = await nameReg.getEAccountFromStr(
                link.previewSender
              );
              if (sender == null) {
                throw new Error(`Note sender not found: ${link.previewSender}`);
              }
              const pending: DaimoNoteStatus = {
                status: "pending",
                link,
                sender,
                dollars: link.previewDollars,
              };
              return pending;
            }
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
        telemetry.recordUserAction("deployWallet", name, opts.ctx);
        const address = await deployWallet(
          name,
          pubKeyHex,
          nameReg,
          accountFactory
        );
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
