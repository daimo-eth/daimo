import * as ExpoEnclave from "@daimo/expo-enclave";
import { DaimoAccount, SigningCallback } from "@daimo/userop";
import { useCallback, useContext } from "react";
import { Address, Hex } from "viem";

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
    const handle = await account.erc20transfer(recipient, `${dollars}`);
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
