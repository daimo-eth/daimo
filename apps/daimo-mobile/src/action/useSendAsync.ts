import { EAccount, EnclaveKeyInfo, OpEvent } from "@daimo/common";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoOpSender, SigningCallback, UserOpHandle } from "@daimo/userop";
import { useCallback, useEffect } from "react";
import { Address, Hex } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { chainConfig } from "../logic/chainConfig";
import { Log } from "../logic/log";
import { useAccount } from "../model/account";
import { resync } from "../sync/sync";

/** Send a tx user op. */
type SendOpFn = (opSender: DaimoOpSender) => Promise<UserOpHandle>;

/** Send a user op, track status. */
export function useSendAsync({
  dollarsToSend,
  sendFn,
  pendingOp,
  namedAccounts,
}: {
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
      account.enclaveKeyInfo,
      account.address,
      keySlot,
      sendFn
    );

    // Add pending op and named accounts to history
    if (pendingOp) {
      pendingOp.opHash = handle.userOpHash as Hex;
      pendingOp.timestamp = Math.floor(Date.now() / 1e3);
      account.recentTransfers.push(pendingOp);
      account.namedAccounts.push(...(namedAccounts || []));
      // TODO: add pending device add/removes
      console.log(`[SEND] added pending op ${pendingOp.opHash}`);

      setAccount(account);

      // In the background, wait for the op to finish
      handle.wait().then(() => resync(`op finished: ${pendingOp.opHash}`));
    }
  }, [account.enclaveKeyInfo, keySlot, sendFn]);

  return { ...as, exec, cost };
}

/** Warm the DaimoOpSender cache. */
export function useWarmCache(
  enclaveKeyInfo?: EnclaveKeyInfo,
  address?: Address,
  keySlot?: number
) {
  useEffect(() => {
    if (!enclaveKeyInfo || !address || !keySlot) return;
    loadOpSender(enclaveKeyInfo, address, keySlot);
  }, [enclaveKeyInfo?.name, enclaveKeyInfo?.forceWeakerKeys, address, keySlot]);
}

const accountCache: Map<[Address, number], Promise<DaimoOpSender>> = new Map();

function loadOpSender(
  enclaveKeyInfo: EnclaveKeyInfo,
  address: Address,
  keySlot: number
) {
  let promise = accountCache.get([address, keySlot]);
  if (promise) return promise;

  promise = (async () => {
    console.info(
      `[SEND] loading DaimoOpSender ${address} ${enclaveKeyInfo.name} ${keySlot}`
    );
    const signer: SigningCallback = async (messageHex: string) => {
      const derSig = await requestEnclaveSignature(
        enclaveKeyInfo,
        messageHex,
        "Authorize transaction"
      );

      return {
        keySlot,
        derSig,
      };
    };

    return await DaimoOpSender.init(
      address,
      signer,
      chainConfig.l2.rpcUrls.public.http[0],
      false
    );
  })();
  accountCache.set([address, keySlot], promise);

  return promise;
}

async function sendAsync(
  setAS: SetActStatus,
  enclaveKeyInfo: EnclaveKeyInfo,
  address: Address,
  keySlot: number | undefined,
  sendFn: SendOpFn
) {
  try {
    if (keySlot === undefined) throw new Error("No key slot");
    setAS("loading", "Loading account...");
    const opSender = await loadOpSender(enclaveKeyInfo, address, keySlot);

    setAS("loading", "Signing...");
    const handle = await sendFn(opSender);
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
  enclaveKeyInfo: EnclaveKeyInfo,
  hexMessage: string,
  usageMessage: string
) {
  const biometricPromptCopy: ExpoEnclave.BiometricPromptCopy = {
    usageMessage,
    androidTitle: "Daimo",
  };

  if (enclaveKeyInfo.forceWeakerKeys) {
    await Log.promise(
      "ExpoEnclaveForceFallbackUsage",
      ExpoEnclave.forceFallbackUsage()
    );
  }

  const signature = await Log.promise(
    "ExpoEnclaveSign",
    ExpoEnclave.sign(enclaveKeyInfo.name, hexMessage, biometricPromptCopy)
  );

  return signature;
}
