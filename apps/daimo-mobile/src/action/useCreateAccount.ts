import * as ExpoEnclave from "@daimo/expo-enclave";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Hex } from "viem";

import { useAccount } from "../logic/account";
import { assert } from "../logic/assert";
import { trpc } from "../logic/trpc";
import { ActHandle, SetActStatus, useActStatus } from "./actStatus";

/** Deploys a new contract wallet and registers it under a given username. */
export function useCreateAccount(name: string): ActHandle {
  const [as, setAS] = useActStatus();

  // Create enclave key immediately, in the idle state
  const [pubKeyHex, setPubKeyHex] = useState("");
  useEffect(() => {
    createEnclaveKey(setAS, setPubKeyHex);
  }, []);

  // On exec, create contract onchain, claiming name.
  const result = trpc.deployWallet.useMutation();
  const exec = async () => {
    setAS("loading", "Deploying contract...");
    result.mutate({ name, pubKeyHex });
  };

  // Once account creation succeeds, save the account
  const [account, setAccount] = useAccount();
  useEffect(() => {
    // Ignore if idle, loading, or already done
    if (account) return;
    if (["idle", "loading"].includes(result.status)) return;
    if (!result.variables || !result.variables.name) return;

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
      name,

      address,
      lastBalance: BigInt(0),
      lastNonce: BigInt(0),
      lastBlockTimestamp: 0,

      enclaveKeyName: "daimo-0",
    });
    setAS("success", "Account created");
  }, [result.isSuccess, result.isError]);

  return { ...as, exec };
}

function getKeySecurityMessage(hwSecLevel: ExpoEnclave.HardwareSecurityLevel) {
  switch (hwSecLevel) {
    case "SOFTWARE":
      return "Key generated";
    case "TRUSTED_ENVIRONMENT":
      return "Key generarated in trusted hardware";
    case "HARDWARE_ENCLAVE":
      return Platform.OS === "ios"
        ? "☑ Key generated in Secure Enclave"
        : "☑ Key generated in Secure Element";
  }
}

async function createEnclaveKey(
  setAS: SetActStatus,
  setPubKeyHex: (hex: Hex) => void
) {
  const enclaveKeyName = "daimo-0";

  setAS("idle", "Creating enclave key...");
  try {
    const pubKey = await ExpoEnclave.createKeyPair(enclaveKeyName);
    setPubKeyHex(`0x${pubKey}`);
  } catch (e: unknown) {
    // May already exist
    try {
      const pubKeyMaybe = await ExpoEnclave.fetchPublicKey(enclaveKeyName);
      if (pubKeyMaybe) setPubKeyHex(`0x${pubKeyMaybe}`);
      else setAS(e as Error);
    } catch {
      setAS(e as Error);
    }
  }

  try {
    const hwSecLevel = await ExpoEnclave.getHardwareSecurityLevel();
    setAS("idle", getKeySecurityMessage(hwSecLevel));
  } catch (e: unknown) {
    console.warn("Error in getHardwareSecurityLevel", e);
    setAS("idle", "Couldn't get hardware security level");
  }
}
