import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { Hex, getContract } from "viem";
import { Contracts } from "contract-types";

import { createAccount, publicClient, walletClient } from "./chain";
import { zAddress, zHex } from "./model";
import { NameRegistry } from "./nameRegistry";
import { publicProcedure, router } from "./trpc";

const account = createAccount(process.env.PRIVATE_KEY);

const nameReg = new NameRegistry();

const accountFactoryContract = getContract({
  abi: Contracts.accountFactoryABI,
  address: Contracts.accountFactoryAddress,
  publicClient,
  walletClient,
});

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

  deployWallet: publicProcedure
    .input(
      z.object({
        name: z.string(),
        pubKeyHex: zHex,
      })
    )
    .mutation(async (opts) => {
      const { name, pubKeyHex } = opts.input;

      // Deploy account
      const pubKey = Buffer.from(pubKeyHex.substring(2), "hex");
      console.log(`[API] deploying account for ${name}, pubkey ${pubKeyHex}`);
      if (pubKey.length !== 65 || pubKey[0] !== 0x04) {
        throw new Error("Invalid public key");
      }
      const key1 = `0x${pubKey.subarray(1, 33).toString("hex")}` as Hex;
      const key2 = `0x${pubKey.subarray(33).toString("hex")}` as Hex;
      const salt = 0n;
      const deployTxHash = await accountFactoryContract.write.createAccount(
        [[key1, key2], salt],
        { account, chain: null }
      );
      console.log(`[API] deploy transaction ${deployTxHash}`);
      const deployReceipt = await publicClient.waitForTransactionReceipt({
        hash: deployTxHash,
      });
      console.log(`[API] deploy transaction ${deployReceipt.status}`);
      if (deployReceipt.status !== "success") {
        return { status: "reverted" as const };
      }

      // Compute CREATE2 deployment address
      // TODO: would prefer to just execute, but viem does support return values
      const addr = await accountFactoryContract.read.getAddress(
        [[key1, key2], salt],
        { account }
      );
      console.log(`[API] new address ${addr}`);

      // Register name
      // TODO: do both in a single contract call
      const registerReceipt = await nameReg.registerName(account, name, addr);
      console.log(
        `[API] register name ${name} at ${addr}: ${registerReceipt.status}`
      );
      return {
        status: registerReceipt.status,
        address: addr,
      };
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
