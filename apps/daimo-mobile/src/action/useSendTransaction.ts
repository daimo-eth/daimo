import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback } from "@daimo/userop";
import { useCallback, useContext } from "react";
import { Address } from "viem";

import { Chain, ChainContext, coin } from "../logic/chain";
import { ActHandle, SetActStatus, useActStatus } from "./actStatus";

export function useSendTransaction(
  enclaveKeyName: string,
  recipient: Address,
  dollars: number
): ActHandle {
  const [as, setAS] = useActStatus();
  const { chain } = useContext(ChainContext);
  if (chain == null) throw new Error("No chain context");

  const exec = useCallback(
    () => sendAsync(chain, setAS, enclaveKeyName, recipient, dollars),
    [enclaveKeyName, recipient, dollars]
  );

  return { ...as, exec };
}

async function sendAsync(
  chain: Chain,
  setAS: SetActStatus,
  enclaveKeyName: string,
  recipient: Address,
  dollars: number
) {
  setAS("loading", "Loading account...");

  // Get our signing pubkey from the enclave
  const derPublicKey = await ExpoEnclave.fetchPublicKey(enclaveKeyName);
  if (derPublicKey == null) {
    setAS("error", "Can't find key in enclave");
    return;
  }

  const signer: SigningCallback = async (hexTx: string) => {
    setAS("loading", "Signing transaction...");
    return await requestEnclaveSignature(enclaveKeyName, hexTx);
  };

  try {
    const account = await DaimoAccount.init(
      chain.clientL2,
      coin.address,
      derPublicKey,
      signer,
      false
    );

    console.log(`[ACTION] sending $${dollars} to ${recipient}`);
    await account.erc20transfer(recipient, `${dollars}`);

    setAS("success", "Sent");
  } catch (e: any) {
    console.error(e);
    setAS("error", e.message);
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
