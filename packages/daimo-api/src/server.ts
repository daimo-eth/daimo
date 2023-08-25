import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { getViemClientFromEnv } from "./chain";
import { AccountFactory } from "./contract/accountFactory";
import { CoinIndexer } from "./contract/coinIndexer";
import { Faucet } from "./contract/faucet";
import { KeyRegistry } from "./contract/keyRegistry";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { OpIndexer } from "./contract/opIndexer";
import { DB } from "./db/db";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";

async function main() {
  console.log(`[API] starting...`);
  const vc = getViemClientFromEnv();

  console.log(`[API] using wallet ${vc.walletClient.account.address}`);
  const coinIndexer = new CoinIndexer(vc);
  const keyReg = new KeyRegistry(vc);
  const nameReg = new NameRegistry(vc);
  const noteIndexer = new NoteIndexer(vc, nameReg);
  const opIndexer = new OpIndexer(vc);
  const faucet = new Faucet(vc, coinIndexer);
  const accountFactory = new AccountFactory(vc);

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.createTables();

  const notifier = new PushNotifier(coinIndexer, nameReg, keyReg, db);

  // Initialize in background
  (async () => {
    console.log(`[API] initializing indexers...`);
    await Promise.all([coinIndexer.init(), nameReg.init()]);
    await Promise.all([faucet.init(), noteIndexer.init()]);
    await Promise.all([opIndexer.init(), keyReg.init()]);

    console.log(`[API] initializing push notifications...`);
    await notifier.init();
  })();

  console.log(`[API] serving...`);
  const router = createRouter(
    vc.l1Client,
    vc.publicClient,
    coinIndexer,
    noteIndexer,
    opIndexer,
    nameReg,
    keyReg,
    faucet,
    notifier,
    accountFactory
  );
  const server = createHTTPServer({ router });
  const { port } = server.listen(3000);

  console.log(`[API] listening on port ${port}`);
}

main().catch(console.error);
