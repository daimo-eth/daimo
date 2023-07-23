import { zHex } from "@daimo/common";
import { Address, Hex } from "viem";

import { loadAddrSummary, loadUserOp } from "./db";

export type SearchResult = SearchResultUserOp | SearchResultAddr;

interface SearchResultUserOp {
  type: "userop";
  hash: Hex;
}

interface SearchResultAddr {
  type: "address";
  addr: Address;
}

export async function search(q: string): Promise<SearchResult[]> {
  // Handle input with or without the leading 0x
  const parsedHex = zHex.safeParse(q.startsWith("0x") ? q : `0x${q}`);

  if (parsedHex.success && parsedHex.data.length === 40 + 2) {
    const addr = await loadAddrSummary(parsedHex.data);
    return addr ? [{ type: "address", addr: addr.address }] : [];
  } else if (parsedHex.success && parsedHex.data.length === 64 + 2) {
    const op = await loadUserOp(parsedHex.data);
    return op ? [{ type: "userop", hash: op.opHash! }] : [];
  } else {
    // TODO: search by Daimo name / ENS
    return [];
  }
}
