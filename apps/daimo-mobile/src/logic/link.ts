import { zAddress } from "@daimo/api";
import { Address } from "viem";

import { assert } from "./assert";

export type DaimoLink = {
  type: "receive";
  addr: Address;
};

/**
 * Creates a deep link.
 *
 * TODO: use Branch or similar to make a http:// deferred deeplink?
 * - Optional for receive, where someone's standing in front of you.
 * - Necessary for request, where recipient gets a linkbox in messaging app.
 */
export function formatDaimoLink(link: DaimoLink): string {
  switch (link.type) {
    case "receive":
      return `daimo://receive/${link.addr}`;
    default:
      throw new Error(`Unhandled Daimo link type ${link.type}`);
  }
}

/** Parses a daimo:// deeplink. */
export function parseDaimoLink(link: string): DaimoLink | null {
  const prefix = "daimo://";
  if (!link.startsWith(prefix)) {
    return null;
  }

  const parts = link.substring(prefix.length).split("/");

  try {
    switch (parts[0]) {
      case "receive": {
        assert(parts.length === 2);
        const addr = zAddress.parse(parts[1]);
        return { type: "receive", addr };
      }
      default:
        throw new Error();
    }
  } catch {
    console.log("[LINK] ignoring invalid Daimo link", link);
    return null;
  }
}
