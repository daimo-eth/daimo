import { DaimoLink, formatDaimoLink } from "@daimo/common";

import { rpcHook } from "./trpc";

export function useFetchLinkStatus(link: DaimoLink | undefined) {
  if (!link) return undefined;

  const url = formatDaimoLink(link);
  const ret = rpcHook.getLinkStatus.useQuery({ url });
  return ret;
}
