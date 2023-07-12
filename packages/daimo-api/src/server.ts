import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { getViemClientFromEnv } from "./chain";
import { CoinIndexer } from "./contract/coinIndexer";
import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { DB } from "./db/db";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";

async function main() {
  console.log(`[API] starting...`);
  const vc = getViemClientFromEnv();

  console.log(`[API] using wallet ${vc.walletClient.account.address}`);
  const coinIndexer = new CoinIndexer(vc);
  const nameReg = new NameRegistry(vc);
  const faucet = new Faucet(vc, coinIndexer);
  const entryPoint = new EntryPoint(vc);

  console.log(`[API] initializing indexers...`);
  await nameReg.init();
  await faucet.init();

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.createTables();

  console.log(`[API] initializing push notifications...`);
  const notifier = new PushNotifier(coinIndexer, nameReg, db);
  await notifier.init();

  console.log(`[API] listening...`);
  const router = createRouter(
    vc.publicClient,
    coinIndexer,
    entryPoint,
    nameReg,
    faucet,
    notifier
  );
  const server = createHTTPServer({ router });
  server.listen(3000);
}

main().catch(console.error);
