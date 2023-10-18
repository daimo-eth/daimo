import { EAccount, zAddress, zHex } from "@daimo/common";
import { getAddress } from "viem";
import { z } from "zod";

import { deployWallet } from "./api/deployWallet";
import { getAccountHistory } from "./api/getAccountHistory";
import { getLinkStatus } from "./api/getLinkStatus";
import { search } from "./api/search";
import { AccountFactory } from "./contract/accountFactory";
import { CoinIndexer } from "./contract/coinIndexer";
import { Faucet } from "./contract/faucet";
import { KeyRegistry } from "./contract/keyRegistry";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { OpIndexer } from "./contract/opIndexer";
import { Paymaster } from "./contract/paymaster";
import { PushNotifier } from "./pushNotifier";
import { Telemetry, zUserAction } from "./telemetry";
import { trpcT } from "./trpc";
import { ViemClient } from "./viemClient";

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
        const ret: EAccount[] = await search(prefix, vc, nameReg);
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
        return getLinkStatus(url, nameReg, opIndexer, coinIndexer, noteIndexer);
      }),

    lookupEthereumAccountByKey: publicProcedure
      .input(z.object({ pubKeyHex: zHex }))
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
        return getAccountHistory(
          address,
          sinceBlockNum,
          vc,
          coinIndexer,
          nameReg,
          keyReg,
          paymaster
        );
      }),

    registerPushToken: publicProcedure
      .input(
        z.object({
          address: zAddress,
          token: z.string(),
        })
      )
      .mutation(async (opts) => {
        // TODO: device attestation or similar to avoid griefing.
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
        telemetry.recordUserAction(opts.ctx, "deployWallet", name);
        const address = await deployWallet(
          name,
          pubKeyHex,
          nameReg,
          accountFactory
        );
        return { status: "success", address };
      }),

    logAction: publicProcedure
      .input(z.object({ action: zUserAction }))
      .mutation(async (opts) => {
        const { action } = opts.input;
        telemetry.recordUserAction(
          opts.ctx,
          `client-${action.name}`,
          action.accountName,
          action.durationMs,
          action.error
        );
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
