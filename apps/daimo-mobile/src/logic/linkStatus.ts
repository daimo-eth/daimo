import { DaimoLink, formatDaimoLink } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";

import { env } from "./env";

export function useFetchLinkStatus(
  link: DaimoLink | undefined,
  daimoChain: DaimoChain
) {
  const url = link ? formatDaimoLink(link) : undefined;
  const rpcHook = env(daimoChain).rpcHook;
  const ret = rpcHook.getLinkStatus.useQuery({ url: url! }, { enabled: !!url });
  return ret;
}
