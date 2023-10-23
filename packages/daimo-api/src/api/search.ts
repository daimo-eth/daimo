import { EAccount } from "@daimo/common";
import { isAddress } from "viem";
import { normalize } from "viem/ens";

import { NameRegistry } from "../contract/nameRegistry";
import { ViemClient } from "../env";

// Search for "vitalik" or "vitalik.eth" matches vitalik.eth
// Search for "jesse.cb.id" matches jesse.cb.id
export async function search(
  prefix: string,
  vc: ViemClient,
  nameReg: NameRegistry
) {
  const ret: EAccount[] = [];
  if (isAddress(prefix)) {
    ret.push(await nameReg.getEAccount(prefix));
  } else {
    const [daimoAccounts, ensAccount] = await Promise.all([
      nameReg.search(prefix),
      tryGetEnsAddr(prefix, vc),
    ]);
    ret.push(...daimoAccounts);
    if (ensAccount) {
      let insertAt = 0;
      if (ret[0] && ret[0].name === prefix) insertAt = 1;
      ret.splice(insertAt, 0, ensAccount);
    }
  }

  console.log(`[API] search: ${ret.length} results for '${prefix}'`);
  return ret;
}

async function tryGetEnsAddr(prefix: string, vc: ViemClient) {
  if (prefix.length < 3) return null;
  if (!prefix.includes(".")) return null;
  try {
    const ensName = normalize(prefix);
    const addr = await vc.l1Client.getEnsAddress({ name: ensName });
    if (addr == null) return null;
    return { ensName, addr } as EAccount;
  } catch (e) {
    console.log(`[API] ens lookup '${prefix}' failed: ${e}`);
    return null;
  }
}
