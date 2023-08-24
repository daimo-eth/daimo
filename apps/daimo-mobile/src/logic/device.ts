import { isDERPubKey, assert } from "@daimo/common";
import { Hex, isHex } from "viem";

export function keySlotToDeviceIdentifier(slot: number): string {
  const base = 26;
  let result = "";
  let n = slot + 1; // 1-indexed
  while (n > 0) {
    const rem = (n - 1) % base;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / base);
  }
  return result;
}

export function findUnusedSlot(slots: number[]): number {
  if (slots.length === 0) return 0;
  const maxSlot = Math.max.apply(null, slots);
  if (maxSlot + 1 < 255) return maxSlot + 1;
  else {
    const used = new Set(slots);
    for (let i = 0; i < 255; i++) {
      if (!used.has(i)) return i;
    }
    throw new Error("no unused slot");
  }
}

export function parseAddDeviceString(addString: string): Hex {
  const [prefix, pubKey] = addString.split(":");
  assert(prefix === "addkey");
  assert(isHex(pubKey));
  assert(isDERPubKey(pubKey));
  return pubKey;
}

export function createAddDeviceString(pubKey: Hex): string {
  assert(isDERPubKey(pubKey));
  return `addkey:${pubKey}`;
}
