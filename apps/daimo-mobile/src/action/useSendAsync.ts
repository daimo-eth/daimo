import { EAccount, OpEvent } from "@daimo/common";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback, UserOpHandle } from "@daimo/userop";
import { useCallback, useEffect } from "react";
import { Address } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { Log } from "../logic/log";
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

  const keySlot = account.accountKeys.find(
    (keyData) => keyData.pubKey === account.enclavePubKey
  )?.slot;

  // TODO: use history to immediately estimate fees
  // Async load fee estimation from API to add precision
  const feeDollars = 0.05;
  const cost = { feeDollars, totalDollars: dollarsToSend + feeDollars };

  const exec = useCallback(async () => {
    const handle = await sendAsync(
      setAS,
      enclaveKeyName,
      account.address,
      keySlot,
      account.forceWeakerKeys,
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
  }, [enclaveKeyName, keySlot, sendFn]);

  return { ...as, exec, cost };
}

/** Warm the DaimoAccount cache. */
export function useWarmCache(
  enclaveKeyName?: string,
  address?: Address,
  keySlot?: number,
  forceWeakerKeys?: boolean
) {
  useEffect(() => {
    if (
      !enclaveKeyName ||
      !address ||
      !keySlot ||
      forceWeakerKeys === undefined
    )
      return;
    loadAccount(enclaveKeyName, address, keySlot, forceWeakerKeys);
  }, [enclaveKeyName, address, keySlot, forceWeakerKeys]);
}

const accountCache: Map<[Address, number], Promise<DaimoAccount>> = new Map();

function loadAccount(
  enclaveKeyName: string,
  address: Address,
  keySlot: number,
  forceWeakerKeys: boolean
) {
  let promise = accountCache.get([address, keySlot]);
  if (promise) return promise;

  promise = (async () => {
    console.info(
      `[SEND] loading DaimoAccount ${address} ${enclaveKeyName} ${keySlot}`
    );
    const signer: SigningCallback = async (hexTx: string) => {
      return {
        derSig: await requestEnclaveSignature(
          enclaveKeyName,
          hexTx,
          "Authorize transaction",
          forceWeakerKeys
        ),
        keySlot,
      };
    };

    return await DaimoAccount.init(address, signer, false);
  })();
  accountCache.set([address, keySlot], promise);

  return promise;
}

async function sendAsync(
  setAS: SetActStatus,
  enclaveKeyName: string,
  address: Address,
  keySlot: number | undefined,
  forceWeakerKeys: boolean,
  sendFn: SendOpFn
) {
  try {
    if (keySlot === undefined) throw new Error("No key slot");
    setAS("loading", "Loading account...");
    const account = await loadAccount(
      enclaveKeyName,
      address,
      keySlot,
      forceWeakerKeys
    );

    setAS("loading", "Signing...");
    const handle = await sendFn(account);
    setAS("success", "Accepted");

    return handle;
  } catch (e: any) {
    console.error(e);
    if (keySlot === undefined) setAS("error", "Device removed from account");
    else setAS("error", "Error sending transaction");
    throw e;
  }
}

export async function requestEnclaveSignature(
  enclaveKeyName: string,
  hexTx: string,
  usageMessage: string,
  forceWeakerKeys: boolean
) {
  const biometricPromptCopy: ExpoEnclave.BiometricPromptCopy = {
    usageMessage,
    androidTitle: "Daimo",
  };

  if (forceWeakerKeys) {
    await Log.promise(
      "ExpoEnclaveForceFallbackUsage",
      ExpoEnclave.forceFallbackUsage()
    );
  }

  const signature = await Log.promise(
    "ExpoEnclaveSign",
    ExpoEnclave.sign(enclaveKeyName, hexTx, biometricPromptCopy)
  );

  return signature;
}
