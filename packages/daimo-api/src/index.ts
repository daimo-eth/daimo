import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

import { getEnvWalletClient } from "./chain";
import { AccountFactory } from "./contract/accountFactory";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { zAddress, zHex } from "./model";
import { publicProcedure, router } from "./trpc";

function createRouter(
  accountFactory: AccountFactory,
  nameReg: NameRegistry,
  faucet: Faucet
) {
  return router({
    search: publicProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async (opts) => {
        const { prefix } = opts.input;
        const ret = await nameReg.search(prefix);
        console.log(`[API] search: ${ret.length} results for '${prefix}'`);
        return ret;
      }),

    resolveName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async (opts) => {
        const { name } = opts.input;
        return await nameReg.resolveName(name);
      }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string(),
          addr: zAddress,
        })
      )
      .mutation(async (opts) => {
        const { name, addr } = opts.input;
        const receipt = await nameReg.registerName(name, addr);
        return receipt.status;
      }),

    deployWallet: publicProcedure
      .input(
        z.object({
          name: z.string(),
          pubKeyHex: zHex,
        })
      )
      .mutation(async (opts) => {
        const { name, pubKeyHex } = opts.input;

        // TODO: deploy and claim name in a single transaction

        // Deploy account
        console.log(`[API] deploying account for ${name}, pubkey ${pubKeyHex}`);
        const res = await accountFactory.deploy(pubKeyHex);
        console.log(`[API] deploy result ${JSON.stringify(res)}`);
        if (res.status !== "success") throw new Error("Deploy failed");
        const { address } = res;

        // Register name
        const registerReceipt = await nameReg.registerName(name, address);
        const { status } = registerReceipt;
        console.log(`[API] register name ${name} at ${address}: ${status}`);
        return { status, address };
      }),

    testnetFaucetStatus: publicProcedure
      .input(z.object({ recipient: zAddress }))
      .query(async (opts) => {
        const { recipient } = opts.input;
        return faucet.getStatus(recipient);
      }),

    testnetRequestFaucet: publicProcedure
      .input(z.object({ recipient: zAddress }))
      .mutation(async (opts) => {
        const { recipient } = opts.input;
        return faucet.request(recipient);
      }),
  });
}

export type AppRouter = ReturnType<typeof createRouter>;

async function main() {
  console.log(`[API] starting...`);
  const walletClient = getEnvWalletClient();
  const nameReg = new NameRegistry(walletClient);
  const faucet = new Faucet(walletClient);
  const accountFactory = new AccountFactory(walletClient);

  console.log(`[API] initializing indexers...`);
  await nameReg.init();
  await faucet.init();

  console.log(`[API] listening...`);
  const router = createRouter(accountFactory, nameReg, faucet);
  const server = createHTTPServer({ router });
  server.listen(3000);
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
