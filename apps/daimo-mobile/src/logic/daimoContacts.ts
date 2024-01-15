import {
  EAccount,
  EAccountSearchResult,
  EmailAddress,
  PhoneNumber,
  getAccountName,
  zEmailAddress,
  zPhoneNumber,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Address } from "viem";

import { getCachedEAccount } from "./addr";
import { env } from "./env";
import { useSystemContactsSearch } from "./systemContacts";
import { Account } from "../model/account";

interface BaseDaimoContact {
  lastSendTime?: number;
}

export interface EAccountContact extends EAccount, BaseDaimoContact {
  type: "eAcc";
  originalMatch?: string;
}

interface EmailContact extends BaseDaimoContact {
  type: "email";
  email: EmailAddress;
  name?: string;
}

interface PhoneNumberContact extends BaseDaimoContact {
  type: "phoneNumber";
  phoneNumber: PhoneNumber;
  name?: string;
}

// A DaimoContact is a "contact" of the user in the app.
// Includes EAccounts and system contacts (email, phone number) with added
// context about the contact based on user's own context. (lastSendTime, etc.)
export type DaimoContact = EAccountContact | EmailContact | PhoneNumberContact;

// An ExternalRecipient is a contact that is not a EAccount. (i.e. not an
// on-chain account)
export type SystemContact = EmailContact | PhoneNumberContact;

/** Convert EAccount to EAccountContact */
export function addLastSendTime(
  account: Account,
  recipientEAcc: EAccount | EAccountSearchResult
): EAccountContact {
  const transfersNewToOld = account.recentTransfers.slice().reverse();
  const lastSendTime = transfersNewToOld.find(
    (t) => t.from === account.address && t.to === recipientEAcc.addr
  )?.timestamp;
  return { type: "eAcc", ...recipientEAcc, lastSendTime };
}

export function getContactName(r: DaimoContact) {
  if (r.type === "eAcc") return getAccountName(r);
  else if (r.type === "email") return r.name ? r.name : r.email;
  else if (r.type === "phoneNumber") return r.name ? r.name : r.phoneNumber;
  else throw new Error(`Unknown recipient type ${r}`);
}

export function useRecipientSearch(
  account: Account,
  prefix: string,
  searchContacts: boolean
) {
  prefix = prefix.toLowerCase();

  // Load recent recipients
  const recents = [] as DaimoContact[];
  const recentsByAddr = new Map<Address, DaimoContact>();
  const transfersNewToOld = account.recentTransfers.slice().reverse();
  for (const t of transfersNewToOld) {
    if (t.from !== account.address) continue;
    const other =
      t.type === "claimLink" || t.type === "createLink"
        ? t.noteStatus.claimer?.addr
        : t.to;
    if (other == null || other === account.address) continue;
    if (recentsByAddr.has(other)) continue;

    const acc = getCachedEAccount(other);

    // HACK: ignore transfers to specially labelled addresses like "payment link"
    // TODO: label transfers by whether occured as part of a send or a different transaction; ignore the latter
    // TODO: show note claimer as recipient.
    if (acc.label != null) continue;

    const r: EAccountContact = {
      type: "eAcc",
      ...acc,
      lastSendTime: t.timestamp,
    };

    recents.push(r);
    recentsByAddr.set(other, r);
  }

  // Always show recent recipients first
  const recipients: DaimoContact[] = [];
  const looseMatchRecents: DaimoContact[] = [];
  for (const r of recents) {
    const name = getContactName(r).toLowerCase();
    if (prefix === "") {
      recipients.push(r); // Show ALL recent recipients
    } else if (name.startsWith(prefix)) {
      recipients.push(r); // Show prefix-matching-name recent recipients
    } else if (prefix.length >= 3 && name.includes(prefix)) {
      looseMatchRecents.push(r); // Show matching-name recent recipients
    }
  }
  if (recipients.length === 0) recipients.push(...looseMatchRecents);

  // If we have a valid phone number or email prefix, show it as a recipient
  if (zEmailAddress.safeParse(prefix).success) {
    recipients.push({ type: "email", email: prefix });
  }

  if (zPhoneNumber.safeParse(prefix).success) {
    recipients.push({ type: "phoneNumber", phoneNumber: prefix });
  }

  // Search if we have a prefix. Anyone we've already sent to appears first.
  // Otherwise, just show recent recipients.
  const enabled = prefix.length >= 1;
  const rpcHook = env(daimoChainFromId(account.homeChainId)).rpcHook;
  const res = rpcHook.search.useQuery({ prefix }, { enabled });
  if (res.data) {
    for (const account of res.data) {
      if (recipients.find((r) => r.type === "eAcc" && r.addr === account.addr))
        continue;

      // Even if we didn't match a given recent above ^, may still be a result.
      const recent = recentsByAddr.get(account.addr);
      if (recent) {
        recipients.push({
          type: "eAcc",
          ...account,
          lastSendTime: recent.lastSendTime,
        });
      } else {
        recipients.push({ type: "eAcc", ...account });
      }
    }
    const sortKey = (r: DaimoContact) => r.lastSendTime || 0;
    recipients.sort((a, b) => sortKey(b) - sortKey(a));
  }

  // Search contacts by name
  const systemContacts = useSystemContactsSearch(
    prefix,
    searchContacts && enabled
  );
  if (systemContacts.length) recipients.push(...systemContacts);

  return {
    isSearching: enabled,
    recipients: recipients.slice(0, 16),
    status: res.status,
    error: res.error,
  };
}
