import { Hex } from "viem";

export function prettifyHex(hash: Hex) {
  return hash.slice(0, 6) + "..." + hash.slice(-4);
}
