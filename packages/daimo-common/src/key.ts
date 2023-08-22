import { Hex } from "viem";

import { assert } from "./assert";

const derPrefix = "0x3059301306072a8648ce3d020106082a8648ce3d03010703420004";

export function isDERPubKey(pubKeyHex: Hex): boolean {
  return (
    pubKeyHex.startsWith(derPrefix) &&
    pubKeyHex.length === derPrefix.length + 128
  );
}

export function DERKeytoContractFriendlyKey(pubKeyHex: Hex): [Hex, Hex] {
  if (!isDERPubKey(pubKeyHex)) {
    throw new Error("Invalid public key format");
  }

  const pubKey = Buffer.from(pubKeyHex.substring(derPrefix.length), "hex");
  assert(pubKey.length === 64);

  const key1 = `0x${pubKey.subarray(0, 32).toString("hex")}` as Hex;
  const key2 = `0x${pubKey.subarray(32).toString("hex")}` as Hex;
  return [key1, key2];
}

export function contractFriendlyKeyToDER(
  accountPubkey: readonly [Hex, Hex]
): Hex {
  return (derPrefix +
    accountPubkey[0].substring(2) +
    accountPubkey[1].substring(2)) as Hex;
}
