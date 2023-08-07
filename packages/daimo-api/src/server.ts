import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { getViemClientFromEnv } from "./chain";
import { CoinIndexer } from "./contract/coinIndexer";
import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { DB } from "./db/db";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";

async function main() {
  console.log(`[API] starting...`);
  const vc = getViemClientFromEnv();

  console.log(`[API] using wallet ${vc.walletClient.account.address}`);
  const coinIndexer = new CoinIndexer(vc);
  const nameReg = new NameRegistry(vc);
  const noteIndexer = new NoteIndexer(vc, nameReg);
  const faucet = new Faucet(vc, coinIndexer);
  const entryPoint = new EntryPoint(vc);

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.createTables();

  const notifier = new PushNotifier(coinIndexer, nameReg, db);

  // Initialize in background
  (async () => {
    console.log(`[API] initializing indexers...`);
    await Promise.all([coinIndexer.init(), nameReg.init()]);
    await Promise.all([faucet.init(), noteIndexer.init()]);

    console.log(`[API] initializing push notifications...`);
    await notifier.init();
  })();

  console.log(`[API] serving...`);
  const router = createRouter(
    vc.l1Client,
    vc.publicClient,
    coinIndexer,
    noteIndexer,
    entryPoint,
    nameReg,
    faucet,
    notifier
  );
  const server = createHTTPServer({ router });
  const { port } = server.listen(3000);

  console.log(`[API] listening on port ${port}`);
}

main().catch(console.error);
