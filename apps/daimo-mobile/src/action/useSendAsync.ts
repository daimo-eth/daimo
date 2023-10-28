import {
  EAccount,
  OpEvent,
  UserOpHex,
  assert,
  dollarsToAmount,
} from "@daimo/common";
import { daimoChainFromId, daimoEphemeralNotesAddress } from "@daimo/contract";
import { DaimoOpSender, OpSenderCallback } from "@daimo/userop";
import { useCallback, useEffect } from "react";
import { Address, Hex } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { env } from "../logic/env";
import { getWrappedRawSigner } from "../logic/key";
import { NamedError } from "../logic/log";
import { Account, useAccount } from "../model/account";

/** Send a user op, returning the userOpHash. */
type SendOpFn = (opSender: DaimoOpSender) => Promise<Hex>;

/** Send a user op, track status. */
export function useSendAsync({
  dollarsToSend,
  sendFn,
  pendingOp,
  accountTransform,
}: {
  dollarsToSend: number;
  sendFn: SendOpFn;
  pendingOp?: OpEvent;
  /** Runs on success, before the account is saved */
  accountTransform?: (account: Account, pendingOp: OpEvent) => Account;
}): ActHandle {
  const [as, setAS] = useActStatus();

  const [account, setAccount] = useAccount();
  if (!account) throw new Error("No account");

  const keySlot = account.accountKeys.find(
    (keyData) => keyData.pubKey === account.enclavePubKey
  )?.slot;

  const feeDollars = account.chainGasConstants.estimatedFee;
  const cost = { feeDollars, totalDollars: dollarsToSend + feeDollars };

  const exec = useCallback(async () => {
    const handle = await sendAsync(
      setAS,
      account.enclaveKeyName,
      account.address,
      keySlot,
      account.homeChainId,
      sendFn
    );

    // Add pending op and named accounts to history
    if (pendingOp) {
      pendingOp.opHash = handle as Hex;
      pendingOp.timestamp = Math.floor(Date.now() / 1e3);
      pendingOp.feeAmount = Number(dollarsToAmount(feeDollars));

      if (accountTransform) {
        const newAccount = accountTransform(account, pendingOp);
        setAccount(newAccount);
      }

      console.log(`[SEND] added pending op ${pendingOp.opHash}`);
    }
  }, [account.enclaveKeyName, keySlot, sendFn]);

  return { ...as, exec, cost };
}

/** Regular transfer account transform. Adds pending transfer to history and
 *  merges any new named accounts. */
export function transferAccountTransform(namedAccounts: EAccount[]) {
  return (account: Account, pendingOp: OpEvent) => {
    assert(pendingOp.type === "transfer");
    // Filter to new named accounts only
    const findAccount = (addr: Address) =>
      account.namedAccounts.find((a) => a.addr === addr);

    namedAccounts = namedAccounts.filter((a) => findAccount(a.addr) == null);

    return {
      ...account,
      recentTransfers: [...account.recentTransfers, pendingOp],
      namedAccounts: [...account.namedAccounts, ...namedAccounts],
    };
  };
}

/** Warm the DaimoOpSender cache. */
export function useWarmCache(
  enclaveKeyName?: string,
  address?: Address,
  keySlot?: number,
  chainId?: number
) {
  useEffect(() => {
    if (!enclaveKeyName || !address || !keySlot || !chainId) return;
    loadOpSender(enclaveKeyName, address, keySlot, chainId);
  }, [enclaveKeyName, address, keySlot, chainId]);
}
const accountCache: Map<[Address, number], Promise<DaimoOpSender>> = new Map();

function loadOpSender(
  enclaveKeyName: string,
  address: Address,
  keySlot: number,
  chainId: number
) {
  let promise = accountCache.get([address, keySlot]);
  if (promise) return promise;

  const daimoChain = daimoChainFromId(chainId);
  const rpcFunc = env(daimoChain).rpcFunc;

  const signer = getWrappedRawSigner(enclaveKeyName, keySlot, daimoChain);

  const sender: OpSenderCallback = async (op: UserOpHex) => {
    return rpcFunc.sendUserOp.mutate({ op });
  };

  promise = (async () => {
    console.info(
      `[SEND] loading DaimoOpSender ${address} ${enclaveKeyName} ${keySlot}`
    );

    return await DaimoOpSender.init({
      chainId,
      tokenAddress: env(daimoChain).chainConfig.tokenAddress,
      tokenDecimals: env(daimoChain).chainConfig.tokenDecimals,
      notesAddress: daimoEphemeralNotesAddress,
      accountAddress: address,
      accountSigner: signer,
      opSender: sender,
    });
  })();
  accountCache.set([address, keySlot], promise);

  return promise;
}

async function sendAsync(
  setAS: SetActStatus,
  enclaveKeyName: string,
  address: Address,
  keySlot: number | undefined,
  chainId: number,
  sendFn: SendOpFn
) {
  try {
    if (keySlot === undefined) throw new Error("No key slot");
    setAS("loading", "Loading account...");
    const opSender = await loadOpSender(
      enclaveKeyName,
      address,
      keySlot,
      chainId
    );

    setAS("loading", "Signing...");
    const handle = await sendFn(opSender);
    setAS("success", "Accepted");

    return handle;
  } catch (e: any) {
    console.error(e);
    if (keySlot === undefined) {
      setAS("error", "Device removed from account");
    } else if (e instanceof NamedError && e.name === "ExpoEnclaveSign") {
      setAS("error", e.message);
    } else setAS("error", "Error sending transaction");
    throw e;
  }
}
