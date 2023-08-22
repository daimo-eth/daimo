import { isDERPubKey, assert } from "@daimo/common";
import { Hex, keccak256 } from "viem";

const emojis = ["🍇", "🍈", "🍉", "🍊", "🍋", "🍌"];

export function pubKeyToEmoji(pubKey: Hex): string {
  return emojis[keccak256(pubKey, "bytes")[0] % emojis.length];
}

export function createAddKeyString(pubKey: Hex): string {
  assert(isDERPubKey(pubKey));
  return `addkey:${pubKey}`;
}

export function parseAddKeyString(addString: string): Hex {
  const [prefix, givenPubKey] = addString.split(":");
  assert(prefix === "addkey");
  const pubKey = `0x${givenPubKey}` as Hex;
  assert(isDERPubKey(pubKey));
  return pubKey;
}
