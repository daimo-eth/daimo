import { rpc } from "./rpc";

// Fetches a profile picture from a Daimo account name.
export async function loadPFPUrl(name: string): Promise<string | undefined> {
  const addr = await rpc.resolveName.query({ name });
  if (addr == null) return undefined;
  const res = await rpc.getEthereumAccount.query({ addr });
  const profilePicture = res.linkedAccounts?.[0]?.pfpUrl;

  if (profilePicture == null) {
    console.log(`[PFP] no PFP found for ${addr}`);
    return undefined;
  }

  console.log(`[PFP] ${addr} fetched profile picture URL ${profilePicture}`);
  return profilePicture;
}
