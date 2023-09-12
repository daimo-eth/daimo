import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { getViemClientFromEnv } from "./chain";
import { AccountFactory } from "./contract/accountFactory";
import { CoinIndexer } from "./contract/coinIndexer";
import { Faucet } from "./contract/faucet";
import { KeyRegistry } from "./contract/keyRegistry";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer } from "./contract/noteIndexer";
import { OpIndexer } from "./contract/opIndexer";
import { Paymaster } from "./contract/paymaster";
import { DB } from "./db/db";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";

async function main() {
  console.log(`[API] starting...`);
  const vc = getViemClientFromEnv();
  await vc.init();

  console.log(`[API] using wallet ${vc.walletClient.account.address}`);
  const keyReg = new KeyRegistry(vc);
  const nameReg = new NameRegistry(vc);
  const opIndexer = new OpIndexer(vc);
  const paymaster = new Paymaster(vc);
  const coinIndexer = new CoinIndexer(vc, opIndexer);
  const noteIndexer = new NoteIndexer(vc, nameReg);
  const faucet = new Faucet(vc, coinIndexer);
  const accountFactory = new AccountFactory(vc);

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.createTables();

  const notifier = new PushNotifier(
    coinIndexer,
    nameReg,
    noteIndexer,
    keyReg,
    db
  );

  // Initialize in background
  (async () => {
    console.log(`[API] initializing indexers...`);
    await Promise.all([
      keyReg.init(),
      nameReg.init(),
      opIndexer.init(),
      paymaster.init(),
    ]);
    await Promise.all([coinIndexer.init(), noteIndexer.init()]);

    console.log(`[API] initializing push notifications...`);
    await Promise.all([notifier.init(), faucet.init()]);

    console.log(`[API] polling logs...`);
    setInterval(() => vc.processLogsToLatestBlock(), 1000);
  })();

  console.log(`[API] serving...`);
  const router = createRouter(
    vc,
    coinIndexer,
    noteIndexer,
    opIndexer,
    nameReg,
    keyReg,
    paymaster,
    faucet,
    notifier,
    accountFactory
  );
  const server = createHTTPServer({ router });
  const { port } = server.listen(3000);

  console.log(`[API] listening on port ${port}`);
}

main().catch(console.error);
