import { assert } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { useEffect } from "react";

import { ActHandle, useActStatus } from "./actStatus";
import { useLoadOrCreateEnclaveKey } from "./key";
import { createEmptyAccount } from "../logic/account";
import { env } from "../logic/env";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

/** Deploys a new contract wallet and registers it under a given username. */
export function useCreateAccount(
  name: string,
  daimoChain: DaimoChain
): ActHandle {
  const [as, setAS] = useActStatus();

  const enclaveKeyName = defaultEnclaveKeyName;
  const pubKeyHex = useLoadOrCreateEnclaveKey(setAS, enclaveKeyName);
  const rpcHook = env(daimoChain).rpcHook;

  // On exec, create contract onchain, claiming name.
  const result = rpcHook.deployWallet.useMutation();
  const exec = async () => {
    if (!pubKeyHex) return;
    setAS("loading", "Creating account...");
    result.mutate({ name, pubKeyHex });
  };

  // Once account creation succeeds, save the account
  const [account, setAccount] = useAccount();
  useEffect(() => {
    // Ignore if idle, loading, or already done
    if (account) return;
    if (["idle", "loading"].includes(result.status)) return;
    if (!result.variables || !result.variables.name) return;
    if (!pubKeyHex) return;

    // RPC failed, offline?
    if (result.status === "error") {
      setAS("error", result.error.message);
      return;
    }
    assert(result.status === "success");

    // RPC succeeded but transaction reverted
    if (result.data.status !== "success") {
      assert(result.data.status === "reverted");
      setAS("error", "Account creation reverted");
      return;
    }

    // Success
    const { name } = result.variables;
    const { address } = result.data;
    console.log(`[CHAIN] created new account ${name} at ${address}`);
    setAccount(
      createEmptyAccount(
        {
          enclaveKeyName,
          enclavePubKey: pubKeyHex,
          name,
          address,
        },
        daimoChain
      )
    );
    setAS("success", "Account created");
  }, [result.isSuccess, result.isError]);

  return { ...as, exec, cost: { feeDollars: 0, totalDollars: 0 } };
}
