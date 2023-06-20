import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { getEnvClients } from "./chain";
import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { DB } from "./db/db";
import { PushNotifier } from "./pushNotifier";
import { createRouter } from "./router";

async function main() {
  console.log(`[API] starting...`);

  const { walletClient, publicClient } = getEnvClients();
  console.log(`[API] using wallet ${walletClient.account.address}`);
  const nameReg = new NameRegistry(walletClient);
  const faucet = new Faucet(walletClient);
  const entryPoint = new EntryPoint(walletClient);

  console.log(`[API] initializing indexers...`);
  await nameReg.init();
  await faucet.init();

  console.log(`[API] initializing db...`);
  const db = new DB();
  await db.createTables();

  console.log(`[API] initializing push notifications...`);
  const notifier = new PushNotifier(publicClient, nameReg, db);
  await notifier.init();

  console.log(`[API] listening...`);
  const router = createRouter(entryPoint, nameReg, faucet, notifier);
  const server = createHTTPServer({ router });
  server.listen(3000);
}

main()
  .then(() => console.log("[API] exiting"))
  .catch(console.error);
