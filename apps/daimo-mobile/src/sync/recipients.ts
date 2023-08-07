import { assertNotNull } from "@daimo/common";
import { Address } from "viem";

import { rpcFunc, rpcHook } from "../logic/trpc";
import { getAccountManager, useAccount } from "../model/account";
import { getCachedEAccount } from "../view/shared/addr";

export interface Recipient {
  addr: Address;
  name?: string;
  lastSendTime?: number;
}

/**
 * Loads recipient info, given an address.
 *
 * It's important to look this up ourselves; can't trust the requester to
 * provide the correct name.
 */
export async function getRecipient(addr: Address): Promise<Recipient> {
  const account = await rpcFunc.getEthereumAccount.query({ addr });

  const { currentAccount } = assertNotNull(getAccountManager());
  const lastSend = (currentAccount?.recentTransfers || []).find(
    (t) => t.to === addr
  );
  const lastSendTime = lastSend?.timestamp;

  return { ...account, lastSendTime };
}

export function useRecipientSearch(prefix: string) {
  prefix = prefix.toLowerCase();

  // Load recent recipients
  const [account] = useAccount();
  const recents = [] as Recipient[];
  const recentsByAddr = new Map<Address, Recipient>();
  const transfersNewToOld = (account?.recentTransfers || []).slice().reverse();
  for (const t of transfersNewToOld) {
    if (t.from !== account?.address) continue;
    const other = t.to;
    if (recentsByAddr.has(other)) continue;

    const acc = getCachedEAccount(other);
    const r: Recipient = { ...acc, lastSendTime: t.timestamp };

    recents.push(r);
    recentsByAddr.set(other, r);
  }

  // Always show recent recipients first
  const recipients: Recipient[] = [];
  const looseMatchRecents: Recipient[] = [];
  for (const r of recents) {
    if (prefix === "") {
      recipients.push(r); // Show ALL recent recipients
    } else if (r.name && r.name.startsWith(prefix)) {
      recipients.push(r); // Show matching-name recent recipients
    } else if (prefix.length >= 3 && r.name && r.name.includes(prefix)) {
      looseMatchRecents.push(r); // Show matching-name recent recipients
    }
  }
  if (recipients.length === 0) recipients.push(...looseMatchRecents);

  // Search if we have a prefix. Anyone we've already sent to appears first.
  // Otherwise, just show recent recipients.
  const enabled = prefix.length >= 1;
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
    recipients,
    status: res.status,
    error: res.error,
  };
}
