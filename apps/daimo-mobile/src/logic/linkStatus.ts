import { DaimoLink, formatDaimoLink } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";

import { env } from "./env";

export function useFetchLinkStatus(
  link: DaimoLink | undefined,
  daimoChain: DaimoChain
) {
  if (!link) return undefined;

  const url = formatDaimoLink(link);
  const rpcHook = env(daimoChain).rpcHook;
  const ret = rpcHook.getLinkStatus.useQuery({ url });
  return ret;
}
