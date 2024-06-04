import { p256 } from "@noble/curves/p256";
import { Hex, bytesToBigInt, hexToBytes } from "viem";

import { assert } from "./assert";

const derPrefix = "0x3059301306072a8648ce3d020106082a8648ce3d03010703420004";

export function isDERPubKey(pubKeyHex: Hex): boolean {
  return (
    pubKeyHex.startsWith(derPrefix) &&
    pubKeyHex.length === derPrefix.length + 128
  );
}

export function derKeytoContractFriendlyKey(pubKeyHex: Hex): [Hex, Hex] {
  if (!isDERPubKey(pubKeyHex)) {
    throw new Error("Invalid public key format");
  }

  const pubKey = pubKeyHex.substring(derPrefix.length);
  assert(pubKey.length === 128);

  const key1 = `0x${pubKey.substring(0, 64)}` as Hex;
  const key2 = `0x${pubKey.substring(64)}` as Hex;
  return [key1, key2];
}

export function contractFriendlyKeyToDER(
  accountPubkey: readonly [Hex, Hex]
): Hex {
  return (derPrefix +
    accountPubkey[0].substring(2) +
    accountPubkey[1].substring(2)) as Hex;
}

// Parse DER-encoded P256-SHA256 signature to contract-friendly signature
// and normalize it so the signature is not malleable.
export function parseAndNormalizeSig(derSig: Hex): { r: bigint; s: bigint } {
  const parsedSignature = p256.Signature.fromDER(derSig.slice(2));
  const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`);
  assert(bSig.length === 64, "signature is not 64 bytes");
  const bR = bSig.slice(0, 32);
  const bS = bSig.slice(32);

  // Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
  const r = bytesToBigInt(bR);
  let s = bytesToBigInt(bS);
  const n = BigInt(
    "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
  );
  if (s > n / 2n) {
    s = n - s;
  }
  return { r, s };
}
