import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import http from "http";

import { getAppVersionTracker } from "./appVersion";
import { Crontab } from "./cron";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";
import { Telemetry } from "./telemetry";
import { createContext, onTrpcError } from "./trpc";
import { ProfileCache } from "../api/profile";
import { AccountFactory } from "../contract/accountFactory";
import { CoinIndexer } from "../contract/coinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { OpIndexer } from "../contract/opIndexer";
import { Paymaster } from "../contract/paymaster";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { chainConfig } from "../env";
import { getBundlerClientFromEnv } from "../network/bundlerClient";
import { getViemClientFromEnv } from "../network/viemClient";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { Watcher } from "../shovel/watcher";

async function main() {
  console.log(`[API] initializing telemetry...`);
  const monitor = new Telemetry();

  console.log(`[API] starting...`);
  const vc = getViemClientFromEnv();

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.createTables();

  console.log(`[API] using wallet ${vc.walletClient.account.address}`);
  const inviteGraph = new InviteGraph(db);
  const profileCache = new ProfileCache(vc, db);

  const keyReg = new KeyRegistry();
  const nameReg = new NameRegistry(
    vc,
    inviteGraph,
    profileCache,
    await db.loadNameBlacklist()
  );
  const inviteCodeTracker = new InviteCodeTracker(vc, nameReg, db);
  const opIndexer = new OpIndexer();
  const noteIndexer = new NoteIndexer(nameReg);
  const requestIndexer = new RequestIndexer(nameReg);
  const coinIndexer = new CoinIndexer(
    vc,
    opIndexer,
    noteIndexer,
    requestIndexer
  );

  const bundlerClient = getBundlerClientFromEnv(opIndexer);
  bundlerClient.init(vc.publicClient);

  const paymaster = new Paymaster(vc, bundlerClient, db);
  const accountFactory = new AccountFactory(vc);
  const crontab = new Crontab(vc, coinIndexer, nameReg, monitor);

  const notifier = new PushNotifier(
    coinIndexer,
    nameReg,
    noteIndexer,
    requestIndexer,
    keyReg,
    db
  );

  const shovelWatcher = new Watcher();
  shovelWatcher.add(
    nameReg,
    keyReg,
    coinIndexer,
    noteIndexer,
    requestIndexer,
    opIndexer
  );

  // Initialize in background
  (async () => {
    console.log(`[API] initializing indexers...`);
    await shovelWatcher.init();
    shovelWatcher.watch();

    await Promise.all([paymaster.init(), inviteGraph.init()]);

    console.log(`[API] initializing push notifications...`);
    await Promise.all([notifier.init(), crontab.init()]);

    console.log(`[API] initializing profile cache...`);
    await profileCache.init();

    console.log(`[API] track latest app version...`);
    await getAppVersionTracker().init();
  })();

  console.log(`[API] serving...`);
  const router = createRouter(
    shovelWatcher,
    vc,
    db,
    bundlerClient,
    coinIndexer,
    noteIndexer,
    requestIndexer,
    profileCache,
    nameReg,
    keyReg,
    paymaster,
    inviteCodeTracker,
    inviteGraph,
    notifier,
    accountFactory,
    monitor
  );
  const handler = createHTTPHandler({
    middleware: cors(),
    router,
    createContext,
    onError: onTrpcError,
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
  server.listen(3000).address();

  console.log(`[API] listening`);
}

main().catch(console.error);
