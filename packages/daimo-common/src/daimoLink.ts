import { Address } from "abitype";
import { Hex, getAddress } from "viem";

import { zDollarStr, zHex } from "./model";

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
  requestId: `${bigint}`;
  recipient: Address;
  dollars: `${number}`;
};

export type DaimoLinkNote = {
  type: "note";
  ephemeralOwner: Address;
  ephemeralPrivateKey?: Hex;
};

export function formatDaimoLink(link: DaimoLink) {
  switch (link.type) {
    case "account": {
      return `${daimoLinkBase}/account/${link.addr}`;
    }
    case "request": {
      return `${daimoLinkBase}/request/${link.requestId.toString()}/${
        link.recipient
      }/${link.dollars}`;
    }
    case "note": {
      const base = `${daimoLinkBase}/note/${link.ephemeralOwner}`;
      const hash = link.ephemeralPrivateKey && `#${link.ephemeralPrivateKey}`;
      return `${base}${hash || ""}`;
    }
  }
}

export function parseDaimoLink(link: string): DaimoLink | null {
  if (link.startsWith("exp+daimo://")) {
    // Ignore Expo development URLs
    return null;
  }

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
  let suffix: string | undefined;
  const prefixes = [`${daimoLinkBase}/`, "daimo://"];
  for (const prefix of prefixes) {
    if (link.startsWith(prefix)) {
      suffix = link.substring(prefix.length);
    }
  }
  if (suffix == null) return null;

  const parts = suffix.split("/");

  switch (parts[0]) {
    case "account": {
      if (parts.length !== 2) return null;
      const addr = getAddress(parts[1]);
      return { type: "account", addr };
    }
    case "request": {
      if (parts.length !== 4) return null;
      const requestId = `${BigInt(parts[1])}` as `${bigint}`;
      const recipient = getAddress(parts[2]);
      const dollarNum = parseFloat(zDollarStr.parse(parts[3]));
      if (!(dollarNum > 0)) return null;
      const dollars = dollarNum.toFixed(2) as `${number}`;
      if (dollars === "0.00") return null;
      return { type: "request", requestId, recipient, dollars };
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
