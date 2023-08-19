import { EAccount, OpEvent } from "@daimo/common";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback, UserOpHandle } from "@daimo/userop";
import { useCallback, useEffect } from "react";
import { Address } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { useAccount } from "../model/account";
import { resync } from "../sync/sync";

/** Send a tx user op. */
type SendOpFn = (account: DaimoAccount) => Promise<UserOpHandle>;

/** Send a user op, track status. */
export function useSendAsync(
  enclaveKeyName: string,
  sendFn: SendOpFn,
  pendingOp?: OpEvent,
  namedAccounts?: EAccount[]
): ActHandle {
  const [as, setAS] = useActStatus();

  const [account, setAccount] = useAccount();
  if (!account) throw new Error("No account");

  const exec = useCallback(async () => {
    const handle = await sendAsync(
      setAS,
      enclaveKeyName,
      account.address,
      sendFn
    );

    if (pendingOp) {
      pendingOp.opHash = handle.userOpHash;
      pendingOp.timestamp = Math.floor(Date.now() / 1e3);
      account.recentTransfers.push(pendingOp);
      account.namedAccounts.push(...(namedAccounts || []));
      console.log(`[SEND] added pending op ${pendingOp.opHash}`);

      setAccount(account);

      // In the background, wait for the op to finish
      handle.wait().then(() => resync(`op finished: ${pendingOp.opHash}`));
    }
  }, [enclaveKeyName, sendFn]);

  return { ...as, exec };
}

/** Warm the DaimoAccount cache. */
export function useWarmCache(enclaveKeyName?: string, address?: Address) {
  useEffect(() => {
    if (!enclaveKeyName || !address) return;
    loadAccount(enclaveKeyName, address);
  }, [enclaveKeyName]);
}

const accountCache: Map<string, Promise<DaimoAccount>> = new Map();

function loadAccount(enclaveKeyName: string, address: Address) {
  let promise = accountCache.get(enclaveKeyName);
  if (promise) return promise;

  promise = (async () => {
    console.info(`[SEND] loading DaimoAccount ${enclaveKeyName}`);
    const signer: SigningCallback = (hexTx: string) =>
      requestEnclaveSignature(enclaveKeyName, hexTx);

    return await DaimoAccount.init(address, signer, false);
  })();
  accountCache.set(enclaveKeyName, promise);

  return promise;
}

async function sendAsync(
  setAS: SetActStatus,
  enclaveKeyName: string,
  address: Address,
  sendFn: SendOpFn
) {
  try {
    setAS("loading", "Loading account...");
    const account = await loadAccount(enclaveKeyName, address);

    setAS("loading", "Signing...");
    const handle = await sendFn(account);
    setAS("success", "Accepted");

    return handle;
  } catch (e: any) {
    console.error(e);
    setAS("error", "Error sending transaction");
    throw e;
  }
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
