import { zAmountStr, zHex } from "@daimo/api";
import { Address } from "abitype";
import { Hex, getAddress } from "viem";

const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DAIMO_DOMAIN;

export const daimoLinkBase = domain
  ? `https://${domain}/link`
  : "http://localhost:3001/link";

/** Represents a Daimo app deep-link */
export type DaimoLink = DaimoLinkAccount | DaimoLinkRequest | DaimoLinkNote;

export type DaimoLinkAccount = {
  type: "account";
  addr: Address;
};

export type DaimoLinkRequest = {
  type: "request";
  recipient: Address;
  amount: `${number}`;
};

export type DaimoLinkNote = {
  type: "note";
  ephemeralOwner: Address;
  ephemeralPrivateKey?: Hex;
};

export function formatDaimoLink(link: DaimoLink) {
  switch (link.type) {
    case "account":
      return `${daimoLinkBase}/account/${link.addr}`;
    case "request":
      return `${daimoLinkBase}/request/${link.recipient}/${link.amount}`;
    case "note":
      if (link.ephemeralPrivateKey == null) {
        return `${daimoLinkBase}/note/${link.ephemeralOwner}`;
      }
      return `${daimoLinkBase}/note/${link.ephemeralOwner}#${link.ephemeralPrivateKey}`;
  }
}

export function parseDaimoLink(link: string): DaimoLink | null {
  try {
    const ret = parseDaimoLinkInner(link);
    if (ret == null) console.warn(`[LINK] ignoring invalid Daimo link`, link);
    return ret;
  } catch (e: any) {
    console.warn(`[LINK] ignoring invalid Daimo link`, link, e);
    return null;
  }
}

function parseDaimoLinkInner(link: string): DaimoLink | null {
  const prefix = `${daimoLinkBase}/`;
  if (!link.startsWith(prefix)) {
    return null;
  }

  const parts = link.substring(prefix.length).split("/");

  switch (parts[0]) {
    case "account": {
      if (parts.length !== 2) return null;
      const addr = getAddress(parts[1]);
      return { type: "account", addr };
    }
    case "request": {
      if (parts.length !== 3) return null;
      const recipient = getAddress(parts[1]);
      const amountNum = parseFloat(zAmountStr.parse(parts[2]));
      if (!(amountNum > 0)) return null;
      const amount = amountNum.toFixed(2) as `${number}`;
      if (amount === "0.00") return null;
      return { type: "request", recipient, amount };
    }
    case "note": {
      if (parts.length !== 2) return null;
      const hashParts = parts[1].split("#");
      if (hashParts.length > 2) return null;
      const ephemeralOwner = getAddress(hashParts[0]);
      const ephemeralPrivateKey =
        hashParts.length < 2 ? undefined : zHex.parse(hashParts[1]);
      return { type: "note", ephemeralOwner, ephemeralPrivateKey };
    }
    default:
      return null;
  }
}
