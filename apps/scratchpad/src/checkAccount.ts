import { erc20Abi, nameRegistryProxyConfig } from "@daimo/contract";
import { Constants } from "userop";
import {
  Address,
  createPublicClient,
  formatUnits,
  getAddress,
  hexToString,
  http,
  stringToHex,
} from "viem";

import { chainConfig } from "./env";

export function checkAccountDesc() {
  return `Check the balance, nonce, etc of a Daimo account.`;
}

export async function checkAccount() {
  const input = process.argv[3];
  if (!input) throw new Error("Usage: check <name or address>");

  const { tokenDecimals, tokenSymbol, chainL2 } = chainConfig;
  console.log(`Daimo account on ${chainL2.name}`);
  console.log("");

  // Resolve name or address
  let name: string, addr: Address;

  const publicClient = createPublicClient({
    chain: chainL2,
    transport: http(),
  });
  if (input.startsWith("0x")) {
    addr = getAddress(input);
    const nameHex = await publicClient.readContract({
      ...nameRegistryProxyConfig,
      functionName: "resolveName",
      args: [addr],
    });
    name = hexToString(nameHex);
  } else {
    name = input;
    const nameHex = stringToHex(name, { size: 32 });
    addr = await publicClient.readContract({
      ...nameRegistryProxyConfig,
      functionName: "resolveAddr",
      args: [nameHex],
    });
  }

  console.log(`ADDR     - ${addr}`);
  console.log(`NAME     - ${name}`);

  // Get balance from coin contract
  const bal = await publicClient.readContract({
    abi: erc20Abi,
    address: chainConfig.tokenAddress,
    functionName: "balanceOf",
    args: [addr],
  });
  const balStr = formatUnits(bal, tokenDecimals) + " " + tokenSymbol;
  console.log(`BAL      - ${balStr}`);

  console.log(`...NameReg ${nameRegistryProxyConfig.address}`);
  console.log(`...  ERC20 ${chainConfig.tokenAddress}`);
  console.log();
}
