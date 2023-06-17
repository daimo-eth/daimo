import { NamedAccount } from "@daimo/api";

import { rpcHook } from "./trpc";

export interface Recipient {
  account: NamedAccount;
  lastSendTime?: number;
}

export function useRecipientSearch(prefix: string) {
  // TODO: get past recipients from local storage
  const recipients: Recipient[] = [];

  const enabled = prefix.length >= 2; // TODO: >= 2
  const res = rpcHook.search.useQuery({ prefix }, { enabled });
  if (res.data) {
    recipients.push(...res.data.map((a) => ({ account: a })));
  }

  return {
    isSearching: enabled,
    recipients,
    status: res.status,
    error: res.error,
  };
}
