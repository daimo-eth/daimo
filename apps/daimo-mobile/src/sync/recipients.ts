import { EAccount, EAccountSearchResult, getAccountName } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Address } from "viem";

import { env } from "../logic/env";
import { Account } from "../model/account";
import { getCachedEAccount } from "../view/shared/addr";

export interface Recipient extends EAccount {
  originalMatch?: string;
  lastSendTime?: number;
}

/** Adds lastSendTime to an EAccount using account's recentTransfers */
export function addLastSendTime(
  account: Account,
  recipientEAcc: EAccount | EAccountSearchResult
): Recipient {
  const transfersNewToOld = account.recentTransfers.slice().reverse();
  const lastSendTime = transfersNewToOld.find(
    (t) => t.from === account.address && t.to === recipientEAcc.addr
  )?.timestamp;
  return { ...recipientEAcc, lastSendTime };
}

export function useRecipientSearch(account: Account, prefix: string) {
  prefix = prefix.toLowerCase();

  // Load recent recipients
  const recents = [] as Recipient[];
  const recentsByAddr = new Map<Address, Recipient>();
  const transfersNewToOld = account.recentTransfers.slice().reverse();
  for (const t of transfersNewToOld) {
    if (t.from !== account.address) continue;
    const other = t.to;
    if (recentsByAddr.has(other)) continue;

    const acc = getCachedEAccount(other);

    // HACK: ignore transfers to specially labelled addresses like "payment link"
    // TODO: label transfers by whether occured as part of a send or a different transaction; ignore the latter
    // TODO: show note claimer as recipient.
    if (acc.label != null) continue;

    const r: Recipient = { ...acc, lastSendTime: t.timestamp };

    recents.push(r);
    recentsByAddr.set(other, r);
  }

  // Always show recent recipients first
  const recipients: Recipient[] = [];
  const looseMatchRecents: Recipient[] = [];
  for (const r of recents) {
    const name = getAccountName(r).toLowerCase();
    if (prefix === "") {
      recipients.push(r); // Show ALL recent recipients
    } else if (name.startsWith(prefix)) {
      recipients.push(r); // Show prefix-matching-name recent recipients
    } else if (prefix.length >= 3 && name.includes(prefix)) {
      looseMatchRecents.push(r); // Show matching-name recent recipients
    }
  }
  if (recipients.length === 0) recipients.push(...looseMatchRecents);

  // Search if we have a prefix. Anyone we've already sent to appears first.
  // Otherwise, just show recent recipients.
  const enabled = prefix.length >= 1;
  const rpcHook = env(daimoChainFromId(account.homeChainId)).rpcHook;
  const res = rpcHook.search.useQuery({ prefix }, { enabled });
  if (res.data) {
    for (const account of res.data) {
      if (recipients.find((r) => r.addr === account.addr)) continue;

      // Even if we didn't match a given recent above ^, may still be a result.
      const recent = recentsByAddr.get(account.addr);
      if (recent) {
        recipients.push({ ...account, lastSendTime: recent.lastSendTime });
      } else {
        recipients.push(account);
      }
    }
    const sortKey = (r: Recipient) => r.lastSendTime || 0;
    recipients.sort((a, b) => sortKey(b) - sortKey(a));
  }

  return {
    isSearching: enabled,
    recipients: recipients.slice(0, 16),
    status: res.status,
    error: res.error,
  };
}
