import { createAccount } from "./chain";
import { zAddress } from "./model";
import { NameRegistry, isValidName } from "./nameRegistry";
import { publicProcedure, router } from "./trpc";

import { z } from "zod";
import { createHTTPServer } from "@trpc/server/adapters/standalone";

const account = createAccount(process.env.PRIVATE_KEY);

const nameReg = new NameRegistry();

const appRouter = router({
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
      const receipt = await nameReg.registerName(account, name, addr);
      return receipt.status;
    }),
});

export type AppRouter = typeof appRouter;

async function main() {
  await nameReg.init();

  const server = createHTTPServer({ router: appRouter });
  server.listen(3000);
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
