import { Hex, keccak256 } from "viem";

const emojis = ["🍇", "🍈", "🍉", "🍊", "🍋", "🍌"];

export function pubKeyToEmoji(pubKey: Hex): string {
  return emojis[keccak256(pubKey, "bytes")[0] % emojis.length];
}
