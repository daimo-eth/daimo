import { assertNotNull } from "@daimo/common";
import { Hex, bytesToString, concatHex, hashMessage, numberToHex } from "viem";

import { getWrappedDeviceKeySigner } from "../logic/key";
import { Account } from "../storage/account";

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
  const signer = getWrappedDeviceKeySigner(enclaveKeyName, keySlot);

  // Create an EIP-191 message hash
  const hashHex = hashMessage({ raw: messageBytes });

  // Sign the message
  const sigResponse = await signer(hashHex);
  const keySlotHex = numberToHex(sigResponse.keySlot, { size: 1 });
  return concatHex([keySlotHex, sigResponse.encodedSig]);
}
