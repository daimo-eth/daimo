import { EAccount } from "@daimo/common";
import { normalize } from "viem/ens";

import { NameRegistry } from "../contract/nameRegistry";
import { ViemClient } from "../viemClient";

// Search for "vitalik" or "vitalik.eth" matches vitalik.eth
// Search for "jesse.cb.id" matches jesse.cb.id
export async function search(
  prefix: string,
  vc: ViemClient,
  nameReg: NameRegistry
) {
  const ret: EAccount[] = [];
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

  console.log(`[API] search: ${ret.length} results for '${prefix}'`);
  return ret;
}

async function tryGetEnsAddr(prefix: string, vc: ViemClient) {
  if (prefix.length < 3) return null;
  try {
    const ensName = normalize(prefix.includes(".") ? prefix : prefix + ".eth");
    const addr = await vc.l1Client.getEnsAddress({ name: ensName });
    if (addr == null) return null;
    return { ensName, addr } as EAccount;
  } catch (e) {
    console.log(`[API] ens lookup '${prefix}' failed: ${e}`);
    return null;
  }
}
