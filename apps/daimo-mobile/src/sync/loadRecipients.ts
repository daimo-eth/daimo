import { Address } from "viem";

import { rpcFunc, rpcHook } from "../logic/trpc";
import { useAccount } from "../model/account";
import { getCachedName } from "../view/shared/addr";

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
  const name = await rpcFunc.resolveAddr.query({ addr });

  // TODO: load last send time
  return { addr, name: name || undefined };
}

export function useRecipientSearch(prefix: string) {
  const [account] = useAccount();

  // Load recent recipients
  const recents = [] as Recipient[];
  const recentsByAddr = new Map<Address, Recipient>();
  const transfersNewToOld = (account?.recentTransfers || []).slice().reverse();
  for (const t of transfersNewToOld) {
    if (t.from !== account?.address) continue;
    const other = t.to;
    if (recentsByAddr.has(other)) continue;

    const name = getCachedName(other);
    const r: Recipient = { addr: other, name, lastSendTime: t.timestamp };

    recents.push(r);
    recentsByAddr.set(other, r);
  }

  const recipients: Recipient[] = [];

  // Search if we have a prefix. Anyone we've already sent to appears first.
  // Otherwise, just show recent recipients.
  const enabled = prefix.length >= 1;
  const res = rpcHook.search.useQuery({ prefix }, { enabled });
  if (res.data) {
    for (const account of res.data) {
      const recent = recentsByAddr.get(account.addr);
      if (recent) {
        recipients.push({ ...account, lastSendTime: recent.lastSendTime });
      } else {
        recipients.push(account);
      }
    }
    const sortKey = (r: Recipient) => r.lastSendTime || 0;
    recipients.sort((a, b) => sortKey(b) - sortKey(a));
  } else if (prefix === "") {
    recipients.push(...recents);
  }

  return {
    isSearching: enabled,
    recipients,
    status: res.status,
    error: res.error,
  };
}
