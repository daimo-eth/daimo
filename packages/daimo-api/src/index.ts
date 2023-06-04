import { createAccount } from "./chain";
import { zAddress } from "./model";
import { NameRegistry } from "./nameRegistry";
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
      return nameReg.search(prefix);
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
      return nameReg.registerName(account, name, addr);
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
