import {
  DaimoLinkInviteCode,
  DaimoLinkRequestV2,
  amountToDollars,
  assert,
  assertNotNull,
  encodeRequestId,
  formatDaimoLink,
  generateRequestId,
  now,
  zAddress,
  zBigIntStr,
  zEAccount,
  zHex,
  zInviteCodeStr,
  zOffchainAction,
  zUserOpHex,
} from "@daimo/common";
import { SpanStatusCode } from "@opentelemetry/api";
import { TRPCError } from "@trpc/server";
import { getAddress, hashMessage, hexToNumber } from "viem";
import { z } from "zod";

import { AntiSpam } from "./antiSpam";
import { PushNotifier } from "./pushNotifier";
import { Telemetry, zUserAction } from "./telemetry";
import { TokenRegistry } from "./tokenRegistry";
import { trpcT } from "./trpc";
import { claimEphemeralNoteSponsored } from "../api/claimEphemeralNoteSponsored";
import { createRequestSponsored } from "../api/createRequestSponsored";
import { deployWallet } from "../api/deployWallet";
import { getAccountHistory } from "../api/getAccountHistory";
import { getExchangeRates } from "../api/getExchangeRates";
import { getLinkStatus } from "../api/getLinkStatus";
import { getMemo } from "../api/getMemo";
import { getSwapQuote } from "../api/getSwapRoute";
import { healthCheck, healthDebug } from "../api/healthCheck";
import { ProfileCache } from "../api/profile";
import { search } from "../api/search";
import { sendUserOpV2 } from "../api/sendUserOpV2";
import { submitWaitlist } from "../api/submitWaitlist";
import {
  createTagRedirect,
  getTagRedirect,
  getTagRedirectHist,
  setTagRedirect,
  verifyTagUpdateToken,
} from "../api/tagRedirect";
import { validateMemo } from "../api/validateMemo";
import { AccountFactory } from "../contract/accountFactory";
import { ForeignCoinIndexer } from "../contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "../contract/homeCoinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { OpIndexer } from "../contract/opIndexer";
import { Paymaster } from "../contract/paymaster";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { ExternalApiCache } from "../db/externalApiCache";
import { IndexWatcher } from "../db/indexWatcher";
import { getEnvApi } from "../env";
import {
  ShouldFastFinishResponse,
  landlineDeposit,
  validateLandlineDeposit,
} from "../landline/connector";
import { runWithLogContext } from "../logging";
import { BinanceClient } from "../network/binanceClient";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient } from "../network/viemClient";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";
import { verifyERC1271Signature } from "../utils/verifySignature";

// Service authentication for, among other things, invite link creation
const apiKeys = new Set(getEnvApi().DAIMO_ALLOWED_API_KEYS?.split(",") || []);
console.log(`[API] allowed API keys: ${[...apiKeys].join(", ")}`);

export function createRouter(
  watcher: IndexWatcher,
  vc: ViemClient,
  db: DB,
  bundlerClient: BundlerClient,
  homeCoinIndexer: HomeCoinIndexer,
  foreignCoinIndexer: ForeignCoinIndexer,
  noteIndexer: NoteIndexer,
  opIndexer: OpIndexer,
  reqIndexer: RequestIndexer,
  profileCache: ProfileCache,
  nameReg: NameRegistry,
  keyReg: KeyRegistry,
  paymaster: Paymaster,
  inviteCodeTracker: InviteCodeTracker,
  paymentMemoTracker: PaymentMemoTracker,
  inviteGraph: InviteGraph,
  notifier: PushNotifier,
  accountFactory: AccountFactory,
  telemetry: Telemetry,
  binanceClient: BinanceClient,
  extApiCache: ExternalApiCache,
  tokenReg: TokenRegistry
) {
  // Log API calls to Honeycomb. Track performance, investigate errors.
  const trpcReqsInFlight = [] as string[];

  const tracerMiddleware = trpcT.middleware(async (opts) => {
    // Request ID for logs + honeycomb
    const reqId = "req:" + Math.floor(Math.random() * 36 ** 6).toString(36);
    const span = telemetry.startApiSpan(opts.ctx, opts.type, opts.path);
    opts.ctx.span = span;
    span.setAttribute("req_id", reqId);

    // Process request
    const slug = `${opts.type}:${opts.path}:${reqId}`;
    trpcReqsInFlight.push(slug);
    const result = await runWithLogContext(reqId, () => opts.next());
    trpcReqsInFlight.splice(trpcReqsInFlight.indexOf(slug), 1);

    // Log request
    const code = result.ok ? SpanStatusCode.OK : SpanStatusCode.ERROR;
    console.log(
      `[${reqId}] [API] ${opts.type} ${opts.path} ${result.ok ? "ok" : "ERR"}`
    );
    span.setStatus({ code }).end();

    return result;
  });

  // CORS for the web app
  const corsMiddleware = trpcT.middleware(async (opts) => {
    opts.ctx.res.setHeader("Access-Control-Allow-Origin", "*");
    return opts.next();
  });

  // Don't serve requests until we're ready.
  // This avoids confusing UI state in local development.
  const readyMiddleware = trpcT.middleware(async (opts) => {
    // Don't serve requests until we're ready.
    // This avoids confusing UI state in local development.
    if (!notifier.isInitialized) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "API not ready",
      });
    }
    return opts.next();
  });

  // API spam protection
  const ipMap = new Map<string, { tsS: number; allowed: boolean }>();
  const antiSpamMiddleware = trpcT.middleware(async (opts) => {
    const { requestInfo } = opts.ctx;
    const ip = assertNotNull(requestInfo["rpc.ip_addr"] as string);
    let ipResult = ipMap.get(ip);
    if (ipResult == null || ipResult.tsS < now() - 60) {
      const allowed = await AntiSpam.shouldServeAPI(requestInfo);
      ipResult = { tsS: now(), allowed };
      ipMap.set(ip, ipResult);
      if (!ipResult.allowed) {
        console.log(`[API] request blocked: ${JSON.stringify(requestInfo)}`);
      }
    }

    if (!ipResult.allowed) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Blocked" });
    }
    return opts.next();
  });

  // const sentryMiddleware = trpcT.middleware(
  //   Sentry.Handlers.trpcMiddleware({ attachRpcInput: true }) as any
  // );

  const publicProcedure = trpcT.procedure
    .use(corsMiddleware)
    .use(tracerMiddleware)
    .use(readyMiddleware)
    .use(antiSpamMiddleware);

  const startTimeS = now();

  return trpcT.router({
    health: publicProcedure.query(async () => {
      const ret = await healthCheck(db, watcher, startTimeS);
      console.log(`[API] health check: ${ret.status}`);
      return ret;
    }),

    healthDebug: publicProcedure.query(async () => {
      return await healthDebug(db, watcher, startTimeS, trpcReqsInFlight);
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

    getSwapQuote: publicProcedure
      .input(
        z.object({
          amountIn: zBigIntStr,
          fromToken: zAddress,
          fromAccount: zEAccount, // TODO: zAddress
          toToken: zAddress,
          toAddr: zAddress,
          chainId: z.number(),
        })
      )
      .query(async (opts) => {
        const { amountIn, fromToken, fromAccount, toToken, toAddr, chainId } =
          opts.input;
        return await getSwapQuote({
          receivedAt: now(),
          amountInStr: amountIn,
          tokenIn: getAddress(fromToken),
          tokenOut: getAddress(toToken),
          fromAccount,
          toAddr,
          chainId,
          vc,
          tokenReg,
        });
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

    createInviteLink: publicProcedure
      .input(
        z.object({
          apiKey: z.string(),
          code: zInviteCodeStr,
          maxUses: z.number(),
          inviter: zAddress,
          bonusDollarsInvitee: z.number(),
          bonusDollarsInviter: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        authorize(input.apiKey);
        return await inviteCodeTracker.insertInviteCode(input);
      }),

    updateInviteLink: publicProcedure
      .input(
        z.object({
          apiKey: z.string(),
          code: z.string(),
          maxUses: z.number().optional(),
          bonusDollarsInviter: z.number().optional(),
          bonusDollarsInvitee: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        authorize(input.apiKey);
        return await inviteCodeTracker.updateInviteCode(input);
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
          lang: z.string().optional(),
        })
      )
      .query(async (opts) => {
        const { inviteCode, sinceBlockNum, lang } = opts.input;
        const address = getAddress(opts.input.address);

        const version = opts.ctx.req.headers["x-daimo-version"] as
          | string
          | undefined;

        return getAccountHistory(
          opts.ctx,
          address,
          inviteCode,
          sinceBlockNum,
          lang,
          vc,
          homeCoinIndexer,
          foreignCoinIndexer,
          profileCache,
          noteIndexer,
          reqIndexer,
          inviteCodeTracker,
          inviteGraph,
          nameReg,
          keyReg,
          paymaster,
          db,
          extApiCache,
          watcher.latestBlock().number,
          version
        );
      }),

    getExchangeRates: publicProcedure.query(async (opts) => {
      const rates = await getExchangeRates(extApiCache);
      return rates;
    }),

    getBestInviteCodeForSender: publicProcedure
      .input(z.object({ apiKey: z.string(), sender: zAddress }))
      .query(async (opts) => {
        const { apiKey, sender } = opts.input;
        authorize(apiKey);

        const inviteCode = await inviteCodeTracker.getBestInviteCodeForSender(
          sender
        );
        return inviteCode;
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

    // Get memo from a transaction hash and log index.
    getMemo: publicProcedure
      .input(z.object({ txHash: zHex, logIndex: z.number() }))
      .query(async (opts) => {
        const { txHash, logIndex } = opts.input;
        return getMemo(txHash, logIndex, opIndexer, paymentMemoTracker);
      }),

    // @deprecated, remove by 2024 Q4
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
          const opHash = await bundlerClient.getOpHash(op, vc.publicClient);
          return await bundlerClient.sendUserOp(opHash, op, vc);
        } catch (e: any) {
          const em = e.message || "no error message";
          span.setAttribute("op.send_err", em);
          telemetry.recordClippy(`❌ sendUserOp ${senderName}: ${em}`, "error");
          throw e;
        }
      }),

    sendUserOpV2: publicProcedure
      .input(z.object({ op: zUserOpHex, memo: z.string().optional() }))
      .mutation(async (opts) => {
        const { op, memo } = opts.input;
        return sendUserOpV2(
          op,
          memo,
          nameReg,
          bundlerClient,
          inviteCodeTracker,
          paymentMemoTracker,
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

    // @deprecated, remove by 2024 Q4
    createRequestSponsored: publicProcedure
      .input(
        z.object({
          idString: z.string(),
          recipient: zAddress,
          amount: zBigIntStr,
          fulfiller: zAddress.optional(),
          memo: z.string().optional(),
        })
      )
      .mutation(async (opts) => {
        const { txHash } = await createRequestSponsored(
          vc,
          reqIndexer,
          paymentMemoTracker,
          nameReg,
          opts.input
        );
        return txHash;
      }),

    createRequestSponsoredV2: publicProcedure
      .input(
        z.object({
          idString: z.string(),
          recipient: zAddress,
          amount: zBigIntStr,
          fulfiller: zAddress.optional(),
          memo: z.string().optional(),
        })
      )
      .mutation(async (opts) => {
        const { txHash, status } = await createRequestSponsored(
          vc,
          reqIndexer,
          paymentMemoTracker,
          nameReg,
          opts.input
        );
        notifier.sendPushNotificationForRequestCreated(status);
        return { txHash, status };
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

    createTagRedirect: publicProcedure
      .input(
        z.object({
          apiKey: z.string(),
          tag: z.string(),
          link: z.string(),
          updateToken: z.string(),
        })
      )
      .mutation(async (opts) => {
        const { apiKey, tag, link, updateToken } = opts.input;
        authorize(apiKey);

        const res = await createTagRedirect(tag, link, updateToken, db);
        return { tag: res.tag, link: res.link };
      }),

    updateTagRedirect: publicProcedure
      .input(
        z.object({ tag: z.string(), link: z.string(), updateToken: z.string() })
      )
      .mutation(async (opts) => {
        const { tag, link, updateToken } = opts.input;

        const res = await setTagRedirect(tag, link, updateToken, db);
        return { tag: res.tag, link: res.link };
      }),

    getTagHistory: publicProcedure
      .input(z.object({ tag: z.string() }))
      .query(async (opts) => {
        const { tag } = opts.input;
        return await getTagRedirectHist(tag, db);
      }),

    // @deprecated, remove by 2024 Q4
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
        const reqInput = { idString, recipient, amount };
        await createRequestSponsored(
          vc,
          reqIndexer,
          paymentMemoTracker,
          nameReg,
          reqInput
        );

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

    validateMemo: publicProcedure
      .input(z.object({ memo: z.string().optional() }))
      .query(async (opts) => {
        const { memo } = opts.input;
        return validateMemo(memo);
      }),

    declineRequest: publicProcedure
      .input(z.object({ requestId: z.string(), decliner: zAddress }))
      .mutation(async (opts) => {
        const { requestId, decliner } = opts.input;
        await reqIndexer.declineRequest(requestId, decliner);
      }),

    depositFromLandline: publicProcedure
      .input(
        z.object({
          daimoAddress: zAddress,
          actionJSON: z.string(),
          signature: zHex,
        })
      )
      .mutation(async (opts) => {
        const { daimoAddress, actionJSON, signature } = opts.input;

        const isValidSignature = await verifyERC1271Signature(
          vc,
          daimoAddress,
          hashMessage(actionJSON),
          signature
        );
        assert(isValidSignature, "Invalid ERC-1271 signature");

        const action = zOffchainAction.parse(JSON.parse(actionJSON));
        assert(action.type === "landlineDeposit", "Invalid action type");

        const response = await landlineDeposit(
          {
            daimoAddress,
            landlineAccountUuid: action.landlineAccountUuid,
            amount: action.amount,
            memo: action.memo,
          },
          opts.ctx
        );

        return response;
      }),

    validateOffchainDeposit: publicProcedure
      .input(
        z.object({
          daimoAddress: zAddress,
          amount: zBigIntStr,
        })
      )
      .query(async (opts) => {
        const { daimoAddress, amount } = opts.input;
        const response: ShouldFastFinishResponse =
          await validateLandlineDeposit({ daimoAddress, amount }, opts.ctx);
        return response;
      }),

    // @deprecated, remove by 2024 Q4
    verifyInviteCode: publicProcedure
      .input(z.object({ inviteCode: z.string() }))
      .query(async (opts) => {
        const { inviteCode } = opts.input;

        const link: DaimoLinkInviteCode = { type: "invite", code: inviteCode };
        const status = await inviteCodeTracker.getInviteCodeStatus(link);
        return status.isValid;
      }),

    getExchangeURL: publicProcedure
      .input(
        z.object({
          addr: zAddress,
          platform: z.enum(["ios", "android", "other"]),
          exchange: z.enum(["binance"]),
          direction: z.enum(["depositFromExchange", "withdrawToExchange"]),
        })
      )
      .query(async (opts) => {
        const { addr, platform, exchange, direction } = opts.input;
        const acc = nameReg.getDaimoAccount(addr);
        if (!acc) throw new TRPCError({ code: "NOT_FOUND" });

        switch (`${exchange}-${direction}`) {
          case "binance-depositFromExchange":
            return await binanceClient.createWithdrawalURL(addr, platform);
          default:
            throw new TRPCError({ code: "NOT_FOUND" });
        }
      }),

    submitWaitlist: publicProcedure
      .input(
        z.object({ name: z.string(), email: z.string(), socials: z.string() })
      )
      .mutation(async (opts) => {
        const { name, email, socials } = opts.input;

        await submitWaitlist(
          name,
          email,
          socials,
          db,
          telemetry,
          inviteCodeTracker
        );
      }),
  });
}

function authorize(apiKey: string) {
  if (apiKeys.has(apiKey)) return;
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: `Invalid API key '${apiKey}'`,
  });
}
