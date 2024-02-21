import { zAddress, zBigIntStr, zHex, zUserOpHex } from "@daimo/common";
import { SpanStatusCode } from "@opentelemetry/api";
import { TRPCError } from "@trpc/server";
import { getAddress, hexToNumber } from "viem";
import { z } from "zod";

import { PushNotifier } from "./pushNotifier";
import { Telemetry, zUserAction } from "./telemetry";
import { trpcT } from "./trpc";
import { claimEphemeralNoteSponsored } from "../api/claimEphemeralNoteSponsored";
import { createRequestSponsored } from "../api/createRequestSponsored";
import { deployWallet } from "../api/deployWallet";
import { getAccountHistory } from "../api/getAccountHistory";
import { getLinkStatus } from "../api/getLinkStatus";
import { ProfileCache } from "../api/profile";
import { search } from "../api/search";
import { AccountFactory } from "../contract/accountFactory";
import { CoinIndexer } from "../contract/coinIndexer";
import { Faucet } from "../contract/faucet";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { Paymaster } from "../contract/paymaster";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient } from "../network/viemClient";
import { Watcher } from "../shovel/watcher";

export function createRouter(
  watcher: Watcher,
  vc: ViemClient,
  db: DB,
  bundlerClient: BundlerClient,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
  requestIndexer: RequestIndexer,
  profileCache: ProfileCache,
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
    console.log(`[API] ${opts.type} ${opts.path} ${result.ok ? "ok" : "ERR"}`);
    span.setStatus({ code }).end();

    return result;
  });

  const corsMiddleware = trpcT.middleware(async (opts) => {
    opts.ctx.res.setHeader("Access-Control-Allow-Origin", "*");
    return opts.next();
  });

  const readyMiddleware = trpcT.middleware(async (opts) => {
    // Don't serve requests until we're ready.
    // This avoids confusing UI state in local development.
    if (!notifier.isInitialized) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
    return opts.next();
  });

  const publicProcedure = trpcT.procedure
    .use(corsMiddleware)
    .use(tracerMiddleware)
    .use(readyMiddleware);

  return trpcT.router({
    health: publicProcedure.query(async (_opts) => {
      // See readyMiddleware
      return "healthy";
    }),

    search: publicProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async (opts) => {
        const { prefix } = opts.input;
        const ret = await search(prefix, vc, nameReg, profileCache);
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
        return getLinkStatus(url, nameReg, noteIndexer, requestIndexer, faucet);
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
          watcher,
          vc,
          coinIndexer,
          profileCache,
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
          inviteLink: z.string().optional(),
        })
      )
      .mutation(async (opts) => {
        const { name, pubKeyHex, invCode, inviteLink } = opts.input;
        telemetry.recordUserAction(opts.ctx, {
          name: "deployWallet",
          accountName: name,
          keys: {},
        });
        const inviteLinkStatus = inviteLink
          ? await getLinkStatus(
              inviteLink,
              nameReg,
              noteIndexer,
              requestIndexer,
              faucet
            )
          : undefined;
        const invCodeSuccess = invCode
          ? await faucet.useInviteCode(invCode)
          : false;
        const address = await deployWallet(
          name,
          pubKeyHex,
          invCodeSuccess,
          inviteLinkStatus,
          watcher,
          nameReg,
          accountFactory,
          faucet,
          telemetry,
          paymaster
        );
        return { status: "success", address };
      }),

    sendUserOp: publicProcedure
      .input(z.object({ op: zUserOpHex }))
      .mutation(async (opts) => {
        const { op } = opts.input;
        const span = opts.ctx.span!;
        span.setAttribute("op.sender", op.sender);
        const senderName = nameReg.resolveDaimoNameForAddr(op.sender);
        span.setAttribute("op.sender_name", senderName || "");
        span.setAttribute("op.nonce", op.nonce);
        const h = hexToNumber;
        span.setAttribute("op.call_gas_limit", h(op.callGasLimit));
        span.setAttribute("op.pre_ver_gas", h(op.preVerificationGas));
        span.setAttribute("op.ver_gas_limit", h(op.verificationGasLimit));
        span.setAttribute("op.paymaster", op.paymasterAndData);

        try {
          return await bundlerClient.sendUserOp(op, vc, nameReg);
        } catch (e: any) {
          const em = e.message || "no error message";
          span.setAttribute("op.send_err", em);
          telemetry.recordClippy(`❌ sendUserOp ${senderName}: ${em}`, "error");
          throw e;
        }
      }),

    logAction: publicProcedure
      .input(z.object({ action: zUserAction }))
      .mutation(async (opts) => {
        const { action } = opts.input;
        telemetry.recordUserAction(opts.ctx, action);
      }),

    // DEPRECATED
    verifyInviteCode: publicProcedure
      .input(z.object({ inviteCode: z.string() }))
      .query(async (opts) => {
        const { inviteCode } = opts.input;
        return faucet.verifyInviteCode(inviteCode);
      }),

    claimEphemeralNoteSponsored: publicProcedure
      .input(
        z.object({
          ephemeralOwner: zAddress,
          recipient: zAddress,
          signature: zHex,
        })
      )
      .mutation(async (opts) => {
        const ephemeralOwner = getAddress(opts.input.ephemeralOwner);
        const recipient = getAddress(opts.input.recipient);
        const signature = opts.input.signature;

        return claimEphemeralNoteSponsored(
          vc,
          noteIndexer,
          ephemeralOwner,
          recipient,
          signature
        );
      }),

    createRequestSponsored: publicProcedure
      .input(
        z.object({
          idString: z.string(),
          recipient: zAddress,
          amount: zBigIntStr,
        })
      )
      .mutation(async (opts) => {
        const { idString, recipient, amount } = opts.input;

        return createRequestSponsored(
          vc,
          requestIndexer,
          idString,
          recipient,
          amount
        );
      }),

    profileLinkAccount: publicProcedure
      .input(
        z.object({
          addr: zAddress,
          linkedAccountJSON: z.string(),
          signature: zHex,
        })
      )
      .mutation(async (opts) => {
        const { addr, linkedAccountJSON, signature } = opts.input;
        return profileCache.linkAccount(addr, linkedAccountJSON, signature);
      }),
  });
}
