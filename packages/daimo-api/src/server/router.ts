import { zAddress, zHex, zUserOpHex } from "@daimo/common";
import { SpanStatusCode } from "@opentelemetry/api";
import { getAddress, hexToNumber } from "viem";
import { z } from "zod";

import { PushNotifier } from "./pushNotifier";
import { Telemetry, zUserAction } from "./telemetry";
import { trpcT } from "./trpc";
import { deployWallet } from "../api/deployWallet";
import { getAccountHistory } from "../api/getAccountHistory";
import { getLinkStatus } from "../api/getLinkStatus";
import { search } from "../api/search";
import { verifyZupass } from "../api/zupass";
import { AccountFactory } from "../contract/accountFactory";
import { CoinIndexer } from "../contract/coinIndexer";
import { Faucet } from "../contract/faucet";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { OpIndexer } from "../contract/opIndexer";
import { Paymaster } from "../contract/paymaster";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient } from "../network/viemClient";

export function createRouter(
  vc: ViemClient,
  bundlerClient: BundlerClient,
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
  // Log API calls to Honeycomb. Track performance, investigate errors.
  const tracerMiddleware = trpcT.middleware(async (opts) => {
    const span = telemetry.startApiSpan(opts.ctx, opts.type, opts.path);
    opts.ctx.span = span;

    const result = await opts.next();

    const code = result.ok ? SpanStatusCode.OK : SpanStatusCode.ERROR;
    span.setStatus({ code }).end();

    return result;
  });

  const corsMiddleware = trpcT.middleware(async (opts) => {
    opts.ctx.res.setHeader("Access-Control-Allow-Origin", "*");
    return opts.next();
  });

  const publicProcedure = trpcT.procedure
    .use(corsMiddleware)
    .use(tracerMiddleware);

  return trpcT.router({
    health: publicProcedure.query(async (_opts) => {
      // Push Notifier is the last service to load.
      const isReady = notifier.isInitialized;
      console.log(`[API] health check. ready? ${isReady}`);
      if (!isReady) throw new Error("not ready");
      return "healthy";
    }),

    search: publicProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async (opts) => {
        const { prefix } = opts.input;
        const ret = await search(prefix, vc, nameReg);
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
          invCode: z.string().optional(),
        })
      )
      .mutation(async (opts) => {
        const { name, pubKeyHex, invCode } = opts.input;
        telemetry.recordUserAction(opts.ctx, "deployWallet", name);
        const address = await deployWallet(
          name,
          pubKeyHex,
          invCode,
          nameReg,
          accountFactory,
          faucet,
          telemetry
        );
        return { status: "success", address };
      }),

    sendUserOp: publicProcedure
      .input(z.object({ op: zUserOpHex }))
      .mutation(async (opts) => {
        const { op } = opts.input;
        const span = opts.ctx.span!;
        span.setAttribute("op.sender", op.sender);
        span.setAttribute("op.nonce", op.nonce);
        const h = hexToNumber;
        span.setAttribute("op.call_gas_limit", h(op.callGasLimit));
        span.setAttribute("op.pre_ver_gas", h(op.preVerificationGas));
        span.setAttribute("op.ver_gas_limit", h(op.verificationGasLimit));
        span.setAttribute("op.paymaster", op.paymasterAndData);
        return bundlerClient.sendUserOp(op);
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

    verifyInviteCode: publicProcedure
      .input(z.object({ inviteCode: z.string() }))
      .query(async (opts) => {
        const { inviteCode } = opts.input;
        return faucet.verifyInviteCode(inviteCode);
      }),

    getZupassInviteCode: publicProcedure
      .input(z.object({ pcd: z.string().optional() }))
      .query(async (opts) => {
        return null;
      }),
  });
}
