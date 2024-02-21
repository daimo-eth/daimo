import { FarcasterLinkedAccount, LinkedAccount } from "@daimo/common";

import { FarcasterBubble } from "./FarcasterBubble";

export function LinkedAccountBubble({ acc }: { acc: LinkedAccount }) {
  if (acc.type === "farcaster") {
    return <FarcasterBubble fcAccount={acc as FarcasterLinkedAccount} />;
  } else {
    throw new Error(`Unsupported linked account ${acc.type}`);
  }
}
