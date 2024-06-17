import { base58 } from "@scure/base";
import {
  Address,
  Hex,
  bytesToBigInt,
  hexToBigInt,
  hexToString,
  numberToBytes,
  stringToHex,
} from "viem";
import { generatePrivateKey } from "viem/accounts";

import { assert } from "./assert";
import { zAddress } from "./model";

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

/**
 * Handle rich request metadata parsing.
 * In the future, we may consider a much stronger form of hashing here,
 * potentially EIP-712 compliant ones.
 */

export type DaimoRichRequestV2 = {
  /** Version number of rich request metadata format */
  v: number;
  /** Proposed fulfiller - user to whom request is sent */
  fulfiller: Address | null;
};

export function createRequestMetadata(reqMeta?: DaimoRichRequestV2): Hex {
  if (reqMeta == null) return "0x";
  return stringToHex(JSON.stringify(reqMeta));
}

export function parseRequestMetadata(metadata: Hex): DaimoRichRequestV2 {
  const parsedMetadata = hexToString(metadata);

  if (["", "\x00"].includes(parsedMetadata)) {
    return { v: 0, fulfiller: null };
  }

  const res = JSON.parse(parsedMetadata);

  // HACK: Accidentally created a transaction with v: "0" instead of 0
  res.v = Number(res.v);
  assert(
    typeof res.v === "number" && !Number.isNaN(res.v),
    "Request version must be a number"
  );

  assert(
    zAddress.safeParse(res.fulfiller).success,
    "Request fulfiller must be an Ethereum address"
  );

  return res;
}
