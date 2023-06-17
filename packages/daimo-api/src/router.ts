import { tokenMetadata } from "@daimo/contract";
import { DaimoAccount } from "@daimo/userop";
import { createPublicClient, http } from "viem";
import { baseGoerli } from "viem/chains";
import { z } from "zod";

import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { zAddress, zHex } from "./model";
import { PushNotifier } from "./pushNotifier";
import { publicProcedure, router } from "./trpc";

export function createRouter(
  entryPoint: EntryPoint,
  nameReg: NameRegistry,
  faucet: Faucet,
  notifier: PushNotifier
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

    registerPushToken: publicProcedure
      .input(
        z.object({
          address: zAddress,
          token: z.string(),
        })
      )
      .mutation(async (opts) => {
        // TODO: device attestation or validate token to avoid griefing
        // Auth is not for privacy; anyone can watch an address onchain.
        const { address, token } = opts.input;
        notifier.register(address, token);
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

        // Don't deploy the account; just get the counterfactual address
        console.log(
          `[API] not deploying account for ${name}, pubkey ${pubKeyHex}`
        );
        const account = await DaimoAccount.init(
          createPublicClient({
            chain: baseGoerli,
            transport: http(),
          }),
          tokenMetadata.address,
          pubKeyHex,
          signer,
          false
        );
        const address = account.getAddress();

        // Prepay gas for the account
        await entryPoint.prefundEth(address, BigInt(1e16)); // 0.1 ETH

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

function signer(hexMessage: string): Promise<string> {
  throw new Error("Function not implemented.");
}
