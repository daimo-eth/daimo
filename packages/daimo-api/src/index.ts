import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { getEnvWalletClient } from "./chain";
import { AccountFactory } from "./contract/accountFactory";
import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { createRouter } from "./router";

export * from "./model";
export { AccountFactory, Faucet, NameRegistry };

export type AppRouter = ReturnType<typeof createRouter>;

async function main() {
  console.log(`[API] starting...`);
  const walletClient = getEnvWalletClient();
  console.log(`[API] using wallet ${walletClient.account.address}`);
  const nameReg = new NameRegistry(walletClient);
  const faucet = new Faucet(walletClient);
  const entryPoint = new EntryPoint(walletClient);

  console.log(`[API] initializing indexers...`);
  await nameReg.init();
  await faucet.init();

  console.log(`[API] listening...`);
  const router = createRouter(entryPoint, nameReg, faucet);
  const server = createHTTPServer({ router });
  server.listen(3000);
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
