import {
  entryPointABI,
  erc20ABI,
  nameRegistryConfig,
  tokenMetadata,
} from "@daimo/contract";
import chalk from "chalk";
import { Constants } from "userop";
import {
  Address,
  createPublicClient,
  formatUnits,
  getAddress,
  getContract,
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
  const nameReg = getContract({ ...nameRegistryConfig, publicClient });
  if (input.startsWith("0x")) {
    addr = getAddress(input);
    name = hexToString(await nameReg.read.resolveName([addr]));
  } else {
    name = input;
    const nameHex = stringToHex(name, { size: 32 });
    addr = await nameReg.read.resolveAddr([nameHex]);
  }

  console.log(`ADDR     - ${chalk.bold(addr)}`);
  console.log(`NAME     - ${chalk.bold(name)}`);

  // Get balance from coin contract
  const coinContract = getContract({
    abi: erc20ABI,
    address: tokenMetadata.address,
    publicClient,
  });
  const bal = await coinContract.read.balanceOf([addr]);
  const { decimals, symbol } = tokenMetadata;
  const balStr = formatUnits(bal, decimals) + " " + symbol;
  console.log(`BAL      - ${chalk.bold(balStr)}`);

  // Get account info from the EntryPoint contract
  const entryPoint = getContract({
    abi: entryPointABI,
    address: getAddress(Constants.ERC4337.EntryPoint),
    publicClient,
  });
  const prefundBal = await entryPoint.read.balanceOf([addr]);
  const prefundStr = formatUnits(prefundBal, 18) + " ETH";
  console.log(`PREFUND  - ${chalk.bold(prefundStr)}`);
  console.log();

  console.log(`...NameReg ${nameReg.address}`);
  console.log(`...  ERC20 ${tokenMetadata.address}`);
  console.log(`EntryPoint ${entryPoint.address}`);
  console.log();
}
