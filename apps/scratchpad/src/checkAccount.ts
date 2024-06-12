import {
  entryPointABI,
  erc20ABI,
  nameRegistryProxyConfig,
} from "@daimo/contract";
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
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless/utils";

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
    abi: erc20ABI,
    address: chainConfig.tokenAddress,
    functionName: "balanceOf",
    args: [addr],
  });
  const balStr = formatUnits(bal, tokenDecimals) + " " + tokenSymbol;
  console.log(`BAL      - ${balStr}`);

  // Get account info from the EntryPoint contract
  const prefundBal = await publicClient.readContract({
    abi: entryPointABI,
    address: getAddress(ENTRYPOINT_ADDRESS_V06),
    functionName: "balanceOf",
    args: [addr],
  });
  const prefundStr = formatUnits(prefundBal, 18) + " ETH";
  console.log(`PREFUND  - ${prefundStr}`);
  console.log();

  console.log(`...NameReg ${nameRegistryProxyConfig.address}`);
  console.log(`...  ERC20 ${chainConfig.tokenAddress}`);
  console.log(`EntryPoint ${ENTRYPOINT_ADDRESS_V06}`);
  console.log();
}
