import {
  DaimoLink,
  formatDaimoLink,
  getInviteStatus,
  stripSeedFromNoteLink,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";

import { getRpcFunc, getRpcHook } from "./trpc";

export function useFetchLinkStatus(
  link: DaimoLink | undefined,
  daimoChain: DaimoChain
) {
  const sanitizedLink = link && stripSeedFromNoteLink(link);
  const url = sanitizedLink && formatDaimoLink(sanitizedLink);
  const rpcHook = getRpcHook(daimoChain);
  return rpcHook.getLinkStatus.useQuery({ url: url! }, { enabled: !!url });
}

export async function fetchInviteLinkStatus(
  daimoChain: DaimoChain,
  inviteLink: DaimoLink | undefined
) {
  const rpcFunc = getRpcFunc(daimoChain);
  const url = inviteLink && formatDaimoLink(stripSeedFromNoteLink(inviteLink));
  const linkStatus = !!url && (await rpcFunc.getLinkStatus.query({ url }));
  const inviteStatus = linkStatus ? getInviteStatus(linkStatus) : undefined;
  return inviteStatus;
}
