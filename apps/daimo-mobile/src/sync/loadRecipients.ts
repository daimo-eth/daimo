import { Address } from "viem";

import { rpcFunc, rpcHook } from "../logic/trpc";

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
  // TODO: get past recipients from local storage
  const recipients: Recipient[] = [];

  const enabled = prefix.length >= 1;
  const res = rpcHook.search.useQuery({ prefix }, { enabled });
  if (res.data) {
    recipients.push(...res.data);
  }

  return {
    isSearching: enabled,
    recipients,
    status: res.status,
    error: res.error,
  };
}
