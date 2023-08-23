import { EAccount, OpEvent } from "@daimo/common";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback, UserOpHandle } from "@daimo/userop";
import { useCallback, useEffect } from "react";
import { Address } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { useLoadKeyFromEnclave } from "../logic/enclave";
import { useAccount } from "../model/account";
import { resync } from "../sync/sync";

/** Send a tx user op. */
type SendOpFn = (account: DaimoAccount) => Promise<UserOpHandle>;

/** Send a user op, track status. */
export function useSendAsync({
  enclaveKeyName,
  dollarsToSend,
  sendFn,
  pendingOp,
  namedAccounts,
}: {
  enclaveKeyName: string;
  dollarsToSend: number;
  sendFn: SendOpFn;
  pendingOp?: OpEvent;
  namedAccounts?: EAccount[];
}): ActHandle {
  const [as, setAS] = useActStatus();

  const [account, setAccount] = useAccount();
  if (!account) throw new Error("No account");

  const selfPubkey = useLoadKeyFromEnclave(enclaveKeyName);
  const keyIdx =
    account.accountKeys.find((keyData) => keyData.key === selfPubkey)
      ?.keyIndex || 0;

  // TODO: use history to immediately estimate fees
  // Async load fee estimation from API to add precision
  const feeDollars = 0.05;
  const cost = { feeDollars, totalDollars: dollarsToSend + feeDollars };

  const exec = useCallback(async () => {
    const handle = await sendAsync(
      setAS,
      enclaveKeyName,
      account.address,
      keyIdx,
      sendFn
    );

    // Add pending op and named accounts to history
    if (pendingOp) {
      pendingOp.opHash = handle.userOpHash;
      pendingOp.timestamp = Math.floor(Date.now() / 1e3);
      account.recentTransfers.push(pendingOp);
      account.namedAccounts.push(...(namedAccounts || []));
      // TODO: add pending device add/removes
      console.log(`[SEND] added pending op ${pendingOp.opHash}`);

      setAccount(account);

      // In the background, wait for the op to finish
      handle.wait().then(() => resync(`op finished: ${pendingOp.opHash}`));
    }
  }, [enclaveKeyName, keyIdx, sendFn]);

  return { ...as, exec, cost };
}

/** Warm the DaimoAccount cache. */
export function useWarmCache(
  enclaveKeyName?: string,
  address?: Address,
  keyIdx?: number
) {
  useEffect(() => {
    if (!enclaveKeyName || !address || !keyIdx) return;
    loadAccount(enclaveKeyName, address, keyIdx);
  }, [enclaveKeyName, address, keyIdx]);
}

const accountCache: Map<[Address, number], Promise<DaimoAccount>> = new Map();

function loadAccount(enclaveKeyName: string, address: Address, keyIdx: number) {
  let promise = accountCache.get([address, keyIdx]);
  if (promise) return promise;

  promise = (async () => {
    console.info(
      `[SEND] loading DaimoAccount ${address} ${enclaveKeyName} ${keyIdx}`
    );
    const signer: SigningCallback = (hexTx: string) => {
      return { derSig: requestEnclaveSignature(enclaveKeyName, hexTx), keyIdx };
    };

    return await DaimoAccount.init(address, signer, false);
  })();
  accountCache.set([address, keyIdx], promise);

  return promise;
}

async function sendAsync(
  setAS: SetActStatus,
  enclaveKeyName: string,
  address: Address,
  keyIdx: number,
  sendFn: SendOpFn
) {
  try {
    setAS("loading", "Loading account...");
    const account = await loadAccount(enclaveKeyName, address, keyIdx);

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
