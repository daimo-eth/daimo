import { UserOpHex, assertNotNull } from "@daimo/common";
import {
  daimoChainFromId,
  notesV1AddressMap,
  notesV2AddressMap,
} from "@daimo/contract";
import { DaimoOpSender, OpSenderCallback } from "@daimo/userop";
import { useEffect } from "react";
import { Address } from "viem";

import { getWrappedDeviceKeySigner } from "./key";
import { DeviceKeySigner, Signer } from "./signer";
import { getRpcFunc } from "./trpc";
import { env } from "../env";
import { Account } from "../storage/account";

/** Default send deadline, in seconds. Determines validUntil for each op. */
export const SEND_DEADLINE_SECS = 120;

/** Warm the DaimoOpSender cache. */
export function useWarmDeviceKeySenderCache(account: Account) {
  const { enclaveKeyName, address } = account;
  const chainId = account.homeChainId;
  const keySlot = account.accountKeys.find(
    (keyData) => keyData.pubKey === account.enclavePubKey
  )?.slot;

  useEffect(() => {
    if (!enclaveKeyName || !address || !keySlot || !chainId) return;

    const signer: DeviceKeySigner = {
      type: "deviceKey",
      keySlot,
      wrappedSigner: getWrappedDeviceKeySigner(account.enclaveKeyName, keySlot),
      account,
    };

    loadOpSender({
      address,
      signer,
      chainId,
    });
  }, [enclaveKeyName, address, keySlot, chainId]);
}

const accountCache: Map<
  [Address, string, number | undefined],
  Promise<DaimoOpSender>
> = new Map();

export function loadOpSender({
  address,
  signer,
  chainId,
}: {
  address: Address;
  signer: Signer;
  chainId: number;
}) {
  const keySlot = "keySlot" in signer ? signer.keySlot : undefined;
  let promise = accountCache.get([address, signer.type, keySlot]);
  if (promise) return promise;

  const daimoChain = daimoChainFromId(chainId);
  const rpcFunc = getRpcFunc(daimoChain);

  const sender: OpSenderCallback = async (op: UserOpHex, memo?: string) => {
    console.info(`[SEND] sending op ${JSON.stringify(op)}`);
    return rpcFunc.sendUserOpV2.mutate({ op, memo });
  };

  promise = (async () => {
    console.info(
      `[SEND] loading DaimoOpSender ${chainId} ${address} ${signer.type}`
    );

    const chainConfig = env(daimoChain).chainConfig;
    return await DaimoOpSender.init({
      chainId,
      tokenAddress: chainConfig.tokenAddress,
      tokenDecimals: chainConfig.tokenDecimals,
      notesAddressV1: assertNotNull(notesV1AddressMap.get(chainId)),
      notesAddressV2: assertNotNull(notesV2AddressMap.get(chainId)),
      accountAddress: address,
      accountSigner: signer.wrappedSigner,
      opSender: sender,
      deadlineSecs: SEND_DEADLINE_SECS,
    });
  })();
  accountCache.set([address, signer.type, keySlot], promise);

  return promise;
}
