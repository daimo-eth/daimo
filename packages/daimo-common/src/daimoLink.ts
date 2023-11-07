import { Address } from "abitype";
import { Hex, getAddress } from "viem";

import { BigIntStr, DollarStr, zDollarStr, zHex } from "./model";

const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DAIMO_DOMAIN;

export const daimoLinkBase = domain
  ? `https://${domain}/link`
  : "http://localhost:3001/link";

/** Represents a Daimo app deep-link */
export type DaimoLink = DaimoLinkAccount | DaimoLinkRequest | DaimoLinkNote;

/** Represents any Ethereum address */
export type DaimoLinkAccount = {
  type: "account";
  /** eAccountStr, eg "bob", "vitalik.eth", "0x..." */
  account: string;
};

/** Represents a request for $x to be paid to y address. */
export type DaimoLinkRequest = {
  type: "request";
  requestId: BigIntStr;
  /** Requester eAccountStr */
  recipient: string;
  dollars: DollarStr;
};

/** Represents a Payment Link. Works like cash, redeemable onchain. */
export type DaimoLinkNote = {
  type: "note";
  /** Sender eAccountStr. To verify, look up ephememeralOwner onchain */
  previewSender: string;
  /** To verify, look up ephememeralOwner onchain */
  previewDollars: DollarStr;
  /** The ephemeral (burner) public key associated with this claimable note. */
  ephemeralOwner: Address;
  /** The ephemeral (burner) private key, from the hash portion of the URL. */
  ephemeralPrivateKey?: Hex;
};

// Returns a shareable https://daimo.com/... deep link.
export function formatDaimoLink(link: DaimoLink) {
  return formatDaimoLinkInner(link, daimoLinkBase);
}

// Returns a direct daimo:// deep link, not shareable.
export function formatDaimoLinkDirect(link: DaimoLink) {
  return formatDaimoLinkInner(link, "daimo:/");
}

function formatDaimoLinkInner(link: DaimoLink, linkBase: string): string {
  switch (link.type) {
    case "account": {
      return `${linkBase}/account/${link.account}`;
    }
    case "request": {
      return [
        linkBase,
        "request",
        link.recipient,
        link.dollars,
        link.requestId.toString(),
      ].join("/");
    }
    case "note": {
      const hash = link.ephemeralPrivateKey && `#${link.ephemeralPrivateKey}`;
      return [
        linkBase,
        "note",
        link.previewSender,
        link.previewDollars,
        link.ephemeralOwner + (hash || ""),
      ].join("/");
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
  const prefixes = [`${daimoLinkBase}/`, "daimo://", "https://daimo.xyz/link/"];
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
      const account = parts[1];
      return { type: "account", account };
    }
    case "request": {
      if (parts.length !== 4) return null;
      const recipient = parts[1];
      const dollarNum = parseFloat(zDollarStr.parse(parts[2]));
      if (!(dollarNum > 0)) return null;
      const dollars = dollarNum.toFixed(2) as DollarStr;
      const requestId = `${BigInt(parts[3])}` as BigIntStr;

      if (dollars === "0.00") return null;
      return { type: "request", requestId, recipient, dollars };
    }
    case "note": {
      let previewSender: string, previewDollars: `${number}`, ephem: string;
      if (parts.length === 2) {
        // backcompat with old notes
        [previewSender, previewDollars] = ["unknown", "0.00"];
        ephem = parts[1];
      } else if (parts.length === 4) {
        previewSender = parts[1];
        const parsedDollars = zDollarStr.safeParse(parts[2]);
        if (!parsedDollars.success) return null;
        previewDollars = parseFloat(parsedDollars.data).toFixed(2) as DollarStr;
        ephem = parts[3];
      } else return null;

      // Parse ephemeral owner and private key
      const hashParts = ephem.split("#");
      if (hashParts.length > 2) return null;
      const ephemeralOwner = getAddress(hashParts[0]);
      const ephemeralPrivateKey =
        hashParts.length < 2 ? undefined : zHex.parse(hashParts[1]);
      return {
        type: "note",
        previewSender,
        previewDollars,
        ephemeralOwner,
        ephemeralPrivateKey,
      };
    }
    default:
      return null;
  }
}
