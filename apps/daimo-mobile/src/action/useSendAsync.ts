import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback, UserOpHandle } from "@daimo/userop";
import { useCallback, useContext, useEffect } from "react";
import { PublicClient } from "wagmi";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { Chain, ChainContext } from "../logic/chain";
import { loadEnclaveKey } from "../logic/enclave";
import { useAccount } from "../model/account";
import { useAccountHistory } from "../model/accountHistory";
import { Op } from "../model/op";
import { resyncAccountHistory } from "../sync/sync";

/** Send a tx user op. */
export type SendOpFn = (account: DaimoAccount) => Promise<UserOpHandle>;

/** Send a user op, track status. */
export function useSendAsync(
  enclaveKeyName: string,
  sendFn: SendOpFn,
  pendingOp?: Op
): ActHandle {
  const [as, setAS] = useActStatus();
  const { chain } = useContext(ChainContext);
  if (chain == null) throw new Error("No chain context");

  const [account] = useAccount();
  if (!account) throw new Error("No account");
  const { address } = account;
  const [hist, setHist] = useAccountHistory(address);
  if (!hist) throw new Error("No account history");

  const exec = useCallback(async () => {
    const handle = await sendAsync(chain, setAS, enclaveKeyName, sendFn);

    if (pendingOp) {
      pendingOp.opHash = handle.userOpHash;
      pendingOp.timestamp = Math.floor(Date.now() / 1e3);
      hist.recentTransfers.push(pendingOp);
      console.log(`[SEND] added pending op ${pendingOp.opHash}`);
      setHist(hist);

      // TODO: disgusting hack
      resyncAccountHistory(hist, setHist);

      // In the background, wait for the op to finish
      handle.wait().then(() => resyncAccountHistory(hist, setHist));
    }
  }, [enclaveKeyName, sendFn]);

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
    console.info(`[SEND] loading DaimoAccount ${enclaveKeyName}`);
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
    setAS("success", "Sent");

    return handle;

    // setAS("loading", "Accepted...");

    // const event = await handle.wait();
    // // TODO: confirm that the user op succeeded
    // if (event) setAS("loading", "Submitted...");
    // else {
    //   // TODO: clean error communication
    //   setAS("error", "Bundle not found");
    //   return;
    // }

    // const receipt = await waitForReceipt(chain, event.transactionHash as Hex);
    // if (receipt.status === "success") setAS("success", "Sent");
    // else setAS("error", "Bundle reverted");
  } catch (e: any) {
    console.error(e);
    setAS("error", e.message);
    throw e;
  }
}

// async function waitForReceipt(chain: Chain, txHash: Hex) {
//   const receipt = await chain.clientL2.waitForTransactionReceipt({
//     hash: txHash,
//     timeout: 30000,
//   });
//   console.log(`[ACTION] tx ${receipt.status}: ${txHash}`);
//   return receipt;
// }

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
