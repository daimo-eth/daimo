import {
  DaimoLinkRequestV2,
  amountToDollars,
  encodeRequestId,
  formatDaimoLink,
  generateRequestId,
  zAddress,
  zBigIntStr,
  zHex,
  zUserOpHex,
} from "@daimo/common";
import { SpanStatusCode } from "@opentelemetry/api";
import { TRPCError } from "@trpc/server";
import { getAddress, hexToNumber } from "viem";
import { z } from "zod";

import { createRequestSponsored } from "../api/createRequestSponsored";
import { deployWallet } from "../api/deployWallet";
import { getAccountHistory } from "../api/getAccountHistory";
import { getLinkStatus } from "../api/getLinkStatus";
import { ProfileCache } from "../api/profile";
import { search } from "../api/search";
import { sendUserOpV2 } from "../api/sendUserOpV2";
import {
  getTagRedirect,
  getTagRedirectHist,
  setTagRedirect,
  verifyTagUpdateToken,
} from "../api/tagRedirect";
import { AccountFactory } from "../contract/accountFactory";
import { CoinIndexer } from "../contract/coinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { Paymaster } from "../contract/paymaster";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient } from "../network/viemClient";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { Watcher } from "../shovel/watcher";
import { PushNotifier } from "./pushNotifier";
import { Telemetry, zUserAction } from "./telemetry";
import { trpcT } from "./trpc";
import { claimEphemeralNoteSponsored } from "../api/claimEphemeralNoteSponsored";

export function createRouter(
  watcher: Watcher,
  vc: ViemClient,
  db: DB,
  bundlerClient: BundlerClient,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
  reqIndexer: RequestIndexer,
  profileCache: ProfileCache,
  nameReg: NameRegistry,
  keyReg: KeyRegistry,
  paymaster: Paymaster,
  inviteCodeTracker: InviteCodeTracker,
  inviteGraph: InviteGraph,
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
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "not ready",
      });
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

    // Get status for a batch of deeplinks (request, payment link, etc)
    getLinkStatusBatch: publicProcedure
      .input(
        z.object({
          urls: z.array(z.string()),
        })
      )
      .query(async (opts) => {
        const { urls } = opts.input;
        const promises = urls.map((url) =>
          getLinkStatus(
            url,
            nameReg,
            noteIndexer,
            reqIndexer,
            inviteCodeTracker,
            db
          )
        );
        const ret = await Promise.all(promises);
        return ret;
      }),

    // Get status for a single deeplink (request, payment link, etc)
    getLinkStatus: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(async (opts) => {
        const { url } = opts.input;
        return getLinkStatus(
          url,
          nameReg,
          noteIndexer,
          reqIndexer,
          inviteCodeTracker,
          db
        );
      }),

    lookupEthereumAccountByKey: publicProcedure
      .input(z.object({ pubKeyHex: zHex }))
      .query(async (opts) => {
        const addr = await keyReg.resolveKey(opts.input.pubKeyHex);
        return addr ? await nameReg.getEAccount(addr) : null;
      }),
    lookupEthereumAccountByFid: publicProcedure
      .input(z.object({ fid: z.number() }))
      .query(async (opts) => {
        const addr = profileCache.getAddress(opts.input.fid);
        if (!addr) return null;

        // registry may return info even without linked accounts, verify first
        const eAccount = await nameReg.getEAccount(addr);
        return eAccount?.linkedAccounts?.length ? eAccount : null;
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
          inviteCode: z.string().optional(),
          sinceBlockNum: z.number(),
        })
      )
      .query(async (opts) => {
        const { inviteCode, sinceBlockNum } = opts.input;
        const address = getAddress(opts.input.address);
        return getAccountHistory(
          opts.ctx,
          address,
          inviteCode,
          sinceBlockNum,
          watcher,
          vc,
          coinIndexer,
          profileCache,
          noteIndexer,
          reqIndexer,
          inviteCodeTracker,
          inviteGraph,
          nameReg,
          keyReg,
          paymaster,
          db
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
          inviteLink: z.string(),
          deviceAttestationString: zHex,
        })
      )
      .mutation(async (opts) => {
        const { name, pubKeyHex, inviteLink, deviceAttestationString } =
          opts.input;
        telemetry.recordUserAction(opts.ctx, {
          name: "deployWallet",
          accountName: name,
          keys: {},
        });
        const inviteLinkStatus = await getLinkStatus(
          inviteLink,
          nameReg,
          noteIndexer,
          reqIndexer,
          inviteCodeTracker,
          db
        );
        const { address, faucetTransfer } = await deployWallet(
          opts.ctx,
          name,
          pubKeyHex,
          inviteLinkStatus,
          deviceAttestationString,
          watcher,
          nameReg,
          accountFactory,
          inviteCodeTracker,
          telemetry,
          paymaster,
          inviteGraph
        );
        return { status: "success", address, faucetTransfer };
      }),

    // DEPRECATED
    sendUserOp: publicProcedure
      .input(z.object({ op: zUserOpHex }))
      .mutation(async (opts) => {
        const { op } = opts.input;
        const span = opts.ctx.span!;
        const senderName = nameReg.resolveDaimoNameForAddr(op.sender);
        const h = hexToNumber;
        const reqInfo = {
          "op.sender": op.sender,
          "op.sender_name": senderName || "",
          "op.nonce": h(op.nonce),
          "op.call_gas_limit": h(op.callGasLimit),
          "op.pre_ver_gas": h(op.preVerificationGas),
          "op.ver_gas_limit": h(op.verificationGasLimit),
          "op.paymaster": op.paymasterAndData,
        };
        span.setAttributes(reqInfo);

        try {
          return await bundlerClient.sendUserOp(op, vc, nameReg);
        } catch (e: any) {
          const em = e.message || "no error message";
          span.setAttribute("op.send_err", em);
          telemetry.recordClippy(`❌ sendUserOp ${senderName}: ${em}`, "error");
          throw e;
        }
      }),

    sendUserOpV2: publicProcedure
      .input(z.object({ op: zUserOpHex }))
      .mutation(async (opts) => {
        const { op } = opts.input;
        return sendUserOpV2(
          op,
          nameReg,
          bundlerClient,
          inviteCodeTracker,
          telemetry,
          vc,
          opts.ctx
        );
      }),

    logAction: publicProcedure
      .input(z.object({ action: zUserAction }))
      .mutation(async (opts) => {
        const { action } = opts.input;
        telemetry.recordUserAction(opts.ctx, action);
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

        return createRequestSponsored(vc, reqIndexer, {
          idString,
          recipient,
          amount,
        });
      }),

    updateProfileLinks: publicProcedure
      .input(
        z.object({
          addr: zAddress,
          actionJSON: z.string(),
          signature: zHex,
        })
      )
      .mutation(async (opts) => {
        const { addr, actionJSON, signature } = opts.input;
        return profileCache.updateProfileLinks(addr, actionJSON, signature);
      }),

    getTagRedirect: publicProcedure
      .input(z.object({ tag: z.string() }))
      .query(async (opts) => {
        const { tag } = opts.input;
        return getTagRedirect(tag, db);
      }),

    updateTagRedirect: publicProcedure
      .input(
        z.object({ tag: z.string(), link: z.string(), updateToken: z.string() })
      )
      .mutation(async (opts) => {
        const { tag, link, updateToken } = opts.input;
        return setTagRedirect(tag, link, updateToken, db);
      }),

    getTagHistory: publicProcedure
      .input(z.object({ tag: z.string() }))
      .query(async (opts) => {
        const { tag } = opts.input;
        return getTagRedirectHist(tag, db);
      }),

    updateTagToNewRequest: publicProcedure
      .input(
        z.object({
          tag: z.string(),
          updateToken: z.string(),
          recipient: zAddress,
          amount: zBigIntStr,
          memo: z.string().optional(),
        })
      )
      .mutation(async (opts) => {
        const { tag, updateToken, recipient, amount, memo } = opts.input;

        await verifyTagUpdateToken(tag, updateToken, db);

        const idString = encodeRequestId(generateRequestId());
        await createRequestSponsored(vc, reqIndexer, {
          idString,
          recipient,
          amount,
        });

        const reqLink: DaimoLinkRequestV2 = {
          type: "requestv2",
          id: idString,
          dollars: amountToDollars(BigInt(amount)),
          recipient,
          memo,
        };
        const url = formatDaimoLink(reqLink);

        await setTagRedirect(tag, url, updateToken, db);

        return url;
      }),
  });
}
