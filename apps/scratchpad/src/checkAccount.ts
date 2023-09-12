import {
  entryPointABI,
  erc20ABI,
  nameRegistryProxyConfig,
  tokenMetadata,
} from "@daimo/contract";
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
import { baseGoerli } from "viem/chains";

export function checkAccountDesc() {
  return `Check the balance, nonce, etc of a Daimo account.`;
}

export async function checkAccount() {
  const input = process.argv[3];
  if (!input) throw new Error("Usage: check <name or address>");

  const chain = baseGoerli;
  console.log(`Daimo account on ${chain.name}`);
  console.log("");

  // Resolve name or address
  let name: string, addr: Address;

  const publicClient = createPublicClient({ chain, transport: http() });
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
    address: tokenMetadata.address,
    functionName: "balanceOf",
    args: [addr],
  });
  const { decimals, symbol } = tokenMetadata;
  const balStr = formatUnits(bal, decimals) + " " + symbol;
  console.log(`BAL      - ${balStr}`);

  // Get account info from the EntryPoint contract
  const prefundBal = await publicClient.readContract({
    abi: entryPointABI,
    address: getAddress(Constants.ERC4337.EntryPoint),
    functionName: "balanceOf",
    args: [addr],
  });
  const prefundStr = formatUnits(prefundBal, 18) + " ETH";
  console.log(`PREFUND  - ${prefundStr}`);
  console.log();

  console.log(`...NameReg ${nameRegistryProxyConfig.address}`);
  console.log(`...  ERC20 ${tokenMetadata.address}`);
  console.log(`EntryPoint ${Constants.ERC4337.EntryPoint}`);
  console.log();
}
