import {
  Address,
  bytesToBigInt,
  bytesToHex,
  createPublicClient,
  getAddress,
  Hex,
  hexToBytes,
  http,
  isAddress,
} from "viem";
import { mainnet } from "viem/chains";

import { daimoFlexSwapperABI, ethereumUSDC, ForeignToken } from "../src";
import tokensJson from "../src/codegen/tokens.json";

const tokens = (tokensJson as ForeignToken[]).filter((t) => t.chainId === 1);

async function main() {
  const tokStr = process.argv[2];
  if (tokStr == null) {
    console.error(`Usage: ${process.argv[1]} <token>`);
  }
  const tokAddr = isAddress(tokStr) && getAddress(tokStr);
  const token = tokens.find((t) => t.token === tokAddr || t.symbol === tokStr);
  if (token == null) {
    console.error(`Token not found: ${tokStr}`);
    return;
  }

  console.log(`Debugging Uniswap quote for: ${JSON.stringify(token, null, 2)}`);
  debugQuote(token);
}

async function debugQuote(token: ForeignToken) {
  const { symbol, decimals } = token;
  const daimoFlexSwapper = "0x207e87f84cff325715f324d09e63b21a03e53b61";

  const client = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const [quote, path] = await client.readContract({
    address: daimoFlexSwapper,
    abi: daimoFlexSwapperABI,
    functionName: "quote",
    args: [ethereumUSDC.token, 1_000_000n, token.token],
  });
  console.log(`1 USDC = ${printDec(quote, decimals)} ${symbol}`);
  console.log(`Swap path:`);
  printSwapPath(token.token, path);

  const [quoteDir, feeDir] = await client.readContract({
    address: daimoFlexSwapper,
    abi: daimoFlexSwapperABI,
    functionName: "quoteDirect",
    args: [ethereumUSDC.token, 1_000_000n, token.token],
  });
  console.log(`1 USDC = ${printDec(quoteDir, decimals)} ${symbol}`);
  console.log(`Direct pool fee: ` + (feeDir / 10000).toFixed(2) + "%");
}

function printDec(value: bigint, decimals: number) {
  const mult = BigInt(10 ** decimals);
  const whole = value / mult;
  const part = (value % mult) + mult;
  return whole + "." + part.toString().slice(1);
}

function printSwapPath(fromAddr: Address, path: Hex) {
  const bytes = hexToBytes(path);
  for (let i = 0; i < bytes.length; i += 23) {
    const addr = getAddress(bytesToHex(bytes.slice(i, i + 20)));
    if (i + 20 < bytes.length) {
      const fee = Number(bytesToBigInt(bytes.slice(i + 20, i + 23)));
      const percent = (fee / 10000).toFixed(2);
      const from = getSymbol(fromAddr);
      const to = getSymbol(addr);
      console.log(`  Pool: ${from}-${to} ${percent}%`);
      fromAddr = addr;
    } else {
      console.log(`  Dest: ${addr}`);
    }
  }
}

function getSymbol(addr: Address) {
  return tokens.find((t) => t.token === addr)?.symbol || addr;
}

main().catch(console.error);
