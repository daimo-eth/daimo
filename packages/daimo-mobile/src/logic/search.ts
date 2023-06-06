import { NamedAccount } from "../../../daimo-api/src/model";
import { trpc } from "./trpc";

export interface Recipient {
  account: NamedAccount;
  lastSendTime?: number;
}

export function useRecipientSearch(prefix: string) {
  // TODO: get past recipients from local storage
  const ret: Recipient[] = [];

  const res = trpc.search.useQuery({ prefix }, { enabled: prefix.length > 1 });
  if (res.data) {
    ret.push(...res.data.map((a) => ({ account: a })));
  }

  return ret;
}
