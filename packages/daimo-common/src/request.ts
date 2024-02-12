import { base58 } from "@scure/base";
import { Hex, bytesToBigInt, hexToBigInt, numberToBytes } from "viem";
import { generatePrivateKey } from "viem/accounts";

export function encodeRequestId(id: bigint) {
  return base58.encode(numberToBytes(id));
}

export function decodeRequestIdString(idString: string) {
  return bytesToBigInt(base58.decode(idString));
}

export function generateRequestId() {
  const hexSeed = generatePrivateKey().slice(
    0,
    2 + Number(64 / 4) // One hex is 4 bits
  ) as Hex; // 64-bit cryptographic random seed.

  return hexToBigInt(hexSeed);
}
