import { assert } from "@daimo/common";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Hex } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { createEnclaveKey } from "../logic/enclave";
import { rpcHook } from "../logic/trpc";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

/** Deploys a new contract wallet and registers it under a given username. */
export function useCreateAccount(name: string): ActHandle {
  const [as, setAS] = useActStatus();

  // Create enclave key immediately, in the idle state
  const enclaveKeyName = defaultEnclaveKeyName;
  const [pubKeyHex, setPubKeyHex] = useState<Hex>();
  useEffect(() => {
    createKey(setAS, enclaveKeyName).then(setPubKeyHex);
  }, []);

  // On exec, create contract onchain, claiming name.
  const result = rpcHook.deployWallet.useMutation();
  const exec = async () => {
    if (!pubKeyHex) return;
    setAS("loading", "Deploying account...");
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
    setAccount({
      enclaveKeyName,
      name,
      address,

      lastBalance: BigInt(0),
      lastBlockTimestamp: 0,
      lastBlock: 0,
      lastFinalizedBlock: 0,

      namedAccounts: [],
      recentTransfers: [],

      pushToken: null,
    });
    setAS("success", "Account created");
  }, [result.isSuccess, result.isError]);

  return { ...as, exec };
}

function getKeySecurityMessage(hwSecLevel: ExpoEnclave.HardwareSecurityLevel) {
  switch (hwSecLevel) {
    case "SOFTWARE":
      return "🔒  Key generated in Secure Enclave";
    case "TRUSTED_ENVIRONMENT":
      return "Key generarated in trusted hardware";
    case "HARDWARE_ENCLAVE":
      return Platform.OS === "ios"
        ? "🔒  Key generated in Secure Enclave"
        : "🔒  Key generated in hardware enclave";
  }
}

async function createKey(setAS: SetActStatus, enclaveKeyName: string) {
  setAS("idle", "Creating enclave key...");
  try {
    const { pubKeyHex, hwSecLevel } = await createEnclaveKey(enclaveKeyName);
    setAS("idle", getKeySecurityMessage(hwSecLevel));
    return pubKeyHex;
  } catch (e: any) {
    console.warn(`[ACCOUNT] ERROR: create key or get HW security level`, e);
    setAS("error", e.message);
    return undefined;
  }
}
