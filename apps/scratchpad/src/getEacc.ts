import { getAddress, isAddress } from "viem";

import { apiUrlWithChain, rpc } from "./rpc";

export function getEaccDesc() {
  return `Gets an EAccount by address.`;
}

export async function getEacc() {
  const addrText = process.argv[3];
  if (!isAddress(addrText)) {
    console.error("Usage: get-eaccount <address>");
    process.exit(1);
  }

  const addr = getAddress(addrText);
  console.log(`Using ${apiUrlWithChain}`);
  console.log(`Looking up ${addr}...`);

  const res = await rpc.getEthereumAccount.query({ addr });
  console.log(JSON.stringify(res, null, 2));
}
