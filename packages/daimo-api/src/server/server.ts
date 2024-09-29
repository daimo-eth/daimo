import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import "dotenv/config";
import http from "http";

import { getAppVersionTracker } from "./appVersion";
import { Crontab } from "./cron";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";
import { Telemetry } from "./telemetry";
import { TokenRegistry } from "./tokenRegistry";
import { createContext, onTrpcError } from "./trpc";
import { ProfileCache } from "../api/profile";
import { AccountFactory } from "../contract/accountFactory";
import { ClogMatcher } from "../contract/ClogMatcher";
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
import { chainConfig, getEnvApi } from "../env";
import { BinanceClient } from "../network/binanceClient";
import { getBundlerClientFromEnv } from "../network/bundlerClient";
import { getViemClientFromEnv } from "../network/viemClient";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";

// Workaround viem bug
(Error.prototype as any).walk = function () {
  return this;
};

async function main() {
  console.log(`[API] initializing telemetry...`);
  const monitor = new Telemetry();

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.migrateDB();

  console.log(`[API] starting...`);
  const extApiCache = new ExternalApiCache(db.kdb);
  const vc = getViemClientFromEnv(monitor, extApiCache);

  console.log(`[API] using wallet ${vc.account.address}`);
  const inviteGraph = new InviteGraph(db);
  const profileCache = new ProfileCache(vc, db);

  const binanceClient = new BinanceClient();

  const keyReg = new KeyRegistry();
  const nameReg = new NameRegistry(
    vc,
    inviteGraph,
    profileCache,
    await db.loadNameBlacklist()
  );
  const inviteCodeTracker = new InviteCodeTracker(vc, nameReg, db);
  const paymentMemoTracker = new PaymentMemoTracker(db);

  const tokenReg = new TokenRegistry();
  await tokenReg.load();

  const clogMatcher = new ClogMatcher(tokenReg);
  const opIndexer = new OpIndexer(clogMatcher);
  const noteIndexer = new NoteIndexer(nameReg, opIndexer, paymentMemoTracker);
  const requestIndexer = new RequestIndexer(db, nameReg, paymentMemoTracker);
  const foreignCoinIndexer = new ForeignCoinIndexer(nameReg, vc, tokenReg);

  const homeCoinIndexer = new HomeCoinIndexer(
    vc,
    opIndexer,
    noteIndexer,
    requestIndexer,
    foreignCoinIndexer,
    paymentMemoTracker,
    clogMatcher
  );

  const bundlerClient = getBundlerClientFromEnv(opIndexer);

  const paymaster = new Paymaster(vc, bundlerClient, db);
  const accountFactory = new AccountFactory(vc);
  const crontab = new Crontab(
    vc,
    homeCoinIndexer,
    foreignCoinIndexer,
    inviteCodeTracker,
    inviteGraph,
    nameReg,
    monitor
  );

  const notifier = new PushNotifier(
    homeCoinIndexer,
    foreignCoinIndexer,
    nameReg,
    noteIndexer,
    requestIndexer,
    keyReg,
    db
  );

  // Set up indexers
  const indexDBUrl = getEnvApi().INDEX_DATABASE_URL;
  const watcher = new IndexWatcher(vc.publicClient, indexDBUrl);
  watcher.add(
    // Dependency order. Within each list, indexers are indexed in parallel.
    [nameReg, keyReg, opIndexer],
    [noteIndexer, requestIndexer, foreignCoinIndexer],
    [homeCoinIndexer]
  );

  // Initialize in background
  (async () => {
    console.log(`[API] initializing indexers...`);
    await watcher.migrateDB();
    await watcher.init();
    watcher.watch();

    await Promise.all([
      paymaster.init(),
      inviteGraph.init(),
      paymentMemoTracker.init(),
      requestIndexer.init(),
    ]);

    console.log(`[API] initializing push notifications...`);
    await Promise.all([notifier.init(), crontab.init()]);

    console.log(`[API] initializing profile cache...`);
    await profileCache.init();

    console.log(`[API] track latest app version...`);
    await getAppVersionTracker().init();
  })();

  console.log(`[API] serving...`);
  const router = createRouter(
    watcher,
    vc,
    db,
    bundlerClient,
    homeCoinIndexer,
    foreignCoinIndexer,
    noteIndexer,
    opIndexer,
    requestIndexer,
    profileCache,
    nameReg,
    keyReg,
    paymaster,
    inviteCodeTracker,
    paymentMemoTracker,
    inviteGraph,
    notifier,
    accountFactory,
    monitor,
    binanceClient,
    extApiCache,
    tokenReg
  );
  const handler = createHTTPHandler({
    middleware: cors(), // handle OPTIONS requests
    router,
    createContext,
    onError: onTrpcError(monitor),
  });

  const trpcPrefix = `/chain/${chainConfig.chainL2.id}/`;
  const server = http.createServer((req, res) => {
    // Only serve requests for the correct network.
    if (req.url == null || !req.url.startsWith(trpcPrefix)) {
      console.log(`[API] SKIPPING ${req.url}`);
      res.writeHead(404);
      res.end();
      return;
    }

    console.log(`[API] serving ${req.method} ${req.url}`);

    req.url = "/" + req.url.slice(trpcPrefix.length);
    handler(req, res);
  });

  const port = 3000;
  server.listen(port).address();

  console.log(`[API] listening on port ${port}`);
}

main().catch(console.error);
