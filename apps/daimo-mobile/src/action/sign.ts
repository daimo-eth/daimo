import { assertNotNull } from "@daimo/common";
import { useCallback, useState } from "react";
import { Hex, bytesToString, concatHex, hashMessage, numberToHex } from "viem";

import { ActStatus, useActStatus } from "./actStatus";
import { getWrappedRawSigner } from "../logic/key";
import { NamedError } from "../logic/log";
import { Account } from "../model/account";

/**
 * Sign a message. Message is hashed per ERC-191:
 * > keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))
 * Signature can be verified per ERC-1271.
 **/
export function useSignAsync({
  account,
  messageBytes,
}: {
  account: Account;
  messageBytes: Buffer;
}): {
  status: ActStatus;
  message: string;
  sign: () => Promise<void>;
  signatureHex?: Hex;
} {
  const [as, setAS] = useActStatus("useSignAsync");
  const [signatureHex, setSig] = useState<Hex>();

  const sign = useCallback(async () => {
    setAS("loading", "Signing...");
    try {
      const sig = await signAsync({ account, messageBytes });
      setSig(sig);
    } catch (e: any) {
      if (
        e instanceof NamedError &&
        ["ExpoEnclaveSign", "ExpoPasskeysCreate", "ExpoPasskeysSign"].includes(
          e.name
        )
      ) {
        setAS("error", e.message);
      } else if (e.message === "Network request failed") {
        setAS("error", "Request failed. Offline?");
      } else {
        setAS("error", "Error sending transaction");
      }
      console.error(`[SIGN] error: ${e}`);
      throw e;
    }
    setAS("success", "Signed");
  }, [account, as, setAS]);

  return { ...as, sign, signatureHex };
}

/** Signs a message. Hashes via ERC-191, returns an ERC-1271 signature. */
export async function signAsync({
  account,
  messageBytes,
}: {
  account: Account;
  messageBytes: Uint8Array;
}): Promise<Hex> {
  console.log(`[SIGN] signing message: ${bytesToString(messageBytes)}`);

  // Load account information, including the device key we're using
  const { enclaveKeyName, enclavePubKey } = account;
  const key = account.accountKeys.find((k) => k.pubKey === enclavePubKey);
  const keySlot = assertNotNull(key, "Key removed from account.").slot;

  // Get a (hardware enclave) signer. No passkey support required, for now.
  const signer = getWrappedRawSigner(enclaveKeyName, keySlot);

  // Create an EIP-191 message hash
  const hashHex = hashMessage({ raw: messageBytes });

  // Sign the message
  const sigResponse = await signer(hashHex);
  const keySlotHex = numberToHex(sigResponse.keySlot, { size: 1 });
  return concatHex([keySlotHex, sigResponse.encodedSig]);
}
