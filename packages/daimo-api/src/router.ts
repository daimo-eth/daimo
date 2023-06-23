import { DaimoAccount } from "@daimo/userop";
import { createPublicClient, http } from "viem";
import { baseGoerli } from "viem/chains";
import { z } from "zod";

import { EntryPoint } from "./contract/entryPoint";
import { Faucet } from "./contract/faucet";
import { NameRegistry } from "./contract/nameRegistry";
import { NamedAccount, zAddress, zHex } from "./model";
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

    resolveAddr: publicProcedure
      .input(z.object({ addr: zAddress }))
      .query(async (opts) => {
        const { addr } = opts.input;
        return await nameReg.resolveAddress(addr);
      }),

    lookupAccountByKey: publicProcedure
      .input(
        z.object({
          pubKeyHex: zHex,
        })
      )
      .query(async (opts) => {
        // TODO: lookup account by signing key
        // Doing this efficiently likely requires an AddKey event
        // Alternately, an indexer contract thru which all accounts are deployed
        let ret = null as NamedAccount | null;

        // Stub to test client
        if (
          opts.input.pubKeyHex ===
          "0x3059301306072a8648ce3d020106082a8648ce3d03010703420004fea4465280cfcb1e1b77a91525ca90dfdd213705b6eac7bc7a79931af4e0cfe7464564a11e15252f840d73da0d34fddb74ebe806e93840f3c208e68d620d7376"
        ) {
          ret = {
            name: "test",
            addr: "0xa3449c3f57af6d39bc9eb41d6e0b75d3723210cd",
          };
        } else if (
          opts.input.pubKeyHex ===
          `0x3059301306072a8648ce3d020106082a8648ce3d0301070342000436dff9029e718c4c7da071077a53a987569ecc780f92203e26afc7b91e1362582ce0bfc65b7cef65dff64768978e691eca8576da6f9d387fe77c70eeaed26f33`
        ) {
          ret = {
            name: "jules",
            addr: "0xbfbff790707f8a9bddae662985270df58011cd9c",
          };
        }

        console.log(
          `[API] lookup found ${ret?.name || "<no account>"} for pubkey ${
            opts.input.pubKeyHex
          }`
        );
        return ret;
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
          pubKeyHex,
          signer,
          false
        );
        const address = account.getAddress();

        // Prepay gas for the account
        await entryPoint.prefundEth(address, BigInt(5e16)); // 0.05 ETH

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
