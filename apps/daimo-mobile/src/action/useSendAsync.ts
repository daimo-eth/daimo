import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback, UserOpHandle } from "@daimo/userop";
import { useCallback, useContext, useEffect } from "react";
import { Hex } from "viem";
import { PublicClient } from "wagmi";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { Chain, ChainContext } from "../logic/chain";
import { loadEnclaveKey } from "../logic/enclave";

/** Send a tx user op. */
export type SendOpFn = (account: DaimoAccount) => Promise<UserOpHandle>;

/** Send a user op, track status. */
export function useSendAsync(
  enclaveKeyName: string,
  sendFn: SendOpFn
): ActHandle {
  const [as, setAS] = useActStatus();
  const { chain } = useContext(ChainContext);
  if (chain == null) throw new Error("No chain context");

  const exec = useCallback(
    () => sendAsync(chain, setAS, enclaveKeyName, sendFn),
    [enclaveKeyName, sendFn]
  );

  return { ...as, exec };
}

/** Warm the DaimoAccount cache. */
export function useWarmCache(enclaveKeyName?: string) {
  const { chain } = useContext(ChainContext);
  if (chain == null) throw new Error("No chain context");

  useEffect(() => {
    if (!enclaveKeyName) return;
    loadAccount(chain.clientL2, enclaveKeyName);
  }, [chain, enclaveKeyName]);
}

const accountCache: Map<string, Promise<DaimoAccount>> = new Map();

function loadAccount(client: PublicClient, enclaveKeyName: string) {
  let promise = accountCache.get(enclaveKeyName);
  if (promise) return promise;

  promise = (async () => {
    console.info(`[USEROP] loading DaimoAccount ${enclaveKeyName}`);
    const signer: SigningCallback = (hexTx: string) =>
      requestEnclaveSignature(enclaveKeyName, hexTx);

    const derPublicKey = await loadEnclaveKey(enclaveKeyName);
    if (!derPublicKey) throw new Error(`Missing enclave key ${enclaveKeyName}`);

    return await DaimoAccount.init(client, derPublicKey, signer, false);
  })();
  accountCache.set(enclaveKeyName, promise);

  return promise;
}

async function sendAsync(
  chain: Chain,
  setAS: SetActStatus,
  enclaveKeyName: string,
  sendFn: SendOpFn
) {
  try {
    setAS("loading", "Loading account...");
    const account = await loadAccount(chain.clientL2, enclaveKeyName);

    setAS("loading", "Signing...");
    const handle = await sendFn(account);
    setAS("loading", "Accepted...");

    const event = await handle.wait();
    // TODO: confirm that the user op succeeded
    if (event) setAS("loading", "Submitted...");
    else {
      // TODO: clean error communication
      setAS("error", "Bundle not found");
      return;
    }

    const receipt = await waitForReceipt(chain, event.transactionHash as Hex);
    if (receipt.status === "success") setAS("success", "Sent");
    else setAS("error", "Bundle reverted");
  } catch (e: any) {
    console.error(e);
    setAS("error", e.message);
    throw e;
  }
}

async function waitForReceipt(chain: Chain, txHash: Hex) {
  const receipt = await chain.clientL2.waitForTransactionReceipt({
    hash: txHash,
    timeout: 30000,
  });
  console.log(`[ACTION] tx ${receipt.status}: ${txHash}`);
  return receipt;
}

async function requestEnclaveSignature(enclaveKeyName: string, hexTx: string) {
  const biometricPromptCopy: ExpoEnclave.BiometricPromptCopy = {
    usageMessage: "Authorize transaction",
    androidTitle: "Daimo",
  };

  const signature = await ExpoEnclave.sign(
    enclaveKeyName,
    hexTx,
    biometricPromptCopy
  );

  return signature;
}
