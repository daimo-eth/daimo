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
  PublicClient,
} from "viem";
import { mainnet } from "viem/chains";

import { ethereumWETH } from "../dist";
import { daimoFlexSwapperAbi, ethereumUSDC, ForeignToken } from "../src";
import tokensJson from "../src/codegen/tokens.json";

async function main() {
  const tokStr = process.argv[2];
  if (tokStr == null) {
    console.error(`Usage: ${process.argv[1]} <token> <optional block number>`);
  }
  const tokAddr = isAddress(tokStr) && getAddress(tokStr);
  const token = (tokensJson as ForeignToken[]).find(
    (t) =>
      t.token === tokAddr || t.symbol.toLowerCase() === tokStr.toLowerCase()
  );
  if (token == null) {
    console.error(`Token not found: ${tokStr}`);
    return;
  }

  let blockNumber: bigint | undefined = undefined;
  if (process.argv[3] != null) {
    blockNumber = BigInt(process.argv[3]);
  }

  const printer = new QuotePrinter();
  await printer.init(blockNumber);

  console.log(`Debugging Uniswap quote for: ${JSON.stringify(token, null, 2)}`);
  console.log();
  printer.debugQuote(token);
}

class QuotePrinter {
  private daimoFlexSwapperAddr: Address;
  private client: PublicClient;
  private tokens: ForeignToken[];
  private blockNumber: bigint;

  constructor() {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(),
    });
    this.daimoFlexSwapperAddr = "0x207e87f84cff325715f324d09e63b21a03e53b61";
    this.tokens = (tokensJson as ForeignToken[]).filter((t) => t.chainId === 1);
  }

  async init(blockNumber?: bigint) {
    const tip = await this.client.getBlockNumber();
    this.blockNumber = blockNumber || tip;
    const { chain } = this.client;
    console.log(`Connected to ${chain?.name} at block ${this.blockNumber}`);
  }

  async debugQuote(token: ForeignToken) {
    console.log(`# Overall quote() USDC to ${token.symbol}`);
    await this.printQuote(ethereumUSDC, token);

    console.log();
    console.log(`# Using quoteDirect() USDC to ${token.symbol}`);
    await this.printQuoteDirect(ethereumUSDC, token);

    console.log();
    console.log(`# Using quoteDirect() WETH to ${token.symbol}`);
    await this.printQuoteDirect(ethereumWETH, token);

    console.log();
    console.log(`# Overall quote() ${token.symbol} to USDC`);
    await this.printQuote(token, ethereumUSDC);

    console.log();
    console.log(`# Using quoteDirect() ${token.symbol} to USDC`);
    await this.printQuoteDirect(token, ethereumUSDC);

    console.log();
    console.log(`# Using quoteDirect() ${token.symbol} to WETH`);
    await this.printQuoteDirect(token, ethereumWETH);
  }

  async printQuote(tokA: ForeignToken, tokB: ForeignToken) {
    const { client, daimoFlexSwapperAddr, blockNumber } = this;
    const [quote, path] = await client.readContract({
      address: daimoFlexSwapperAddr,
      abi: daimoFlexSwapperAbi,
      functionName: "quote",
      args: [tokA.token, 10n ** BigInt(tokA.decimals), tokB.token],
      blockNumber,
    });
    const numB = this.printDec(quote, tokB.decimals);
    console.log(`1 ${tokA.symbol} = ${numB} ${tokB.symbol}`);
    console.log(`Swap path:`);
    this.printSwapPath(path);
  }

  async printQuoteDirect(tokA: ForeignToken, tokB: ForeignToken) {
    const { client, daimoFlexSwapperAddr, blockNumber } = this;
    const [pool, , fee, amountOut] = await client.readContract({
      address: daimoFlexSwapperAddr,
      abi: daimoFlexSwapperAbi,
      functionName: "getBestPoolTick",
      args: [tokA.token, 10n ** BigInt(tokA.decimals), tokB.token],
      blockNumber,
    });
    const numB = this.printDec(amountOut, tokB.decimals);
    console.log(`1 ${tokA.symbol} = ${numB} ${tokB.symbol}`);
    console.log(`Direct pool: ${getAddress(pool)}`);
    console.log(`Direct pool fee: ` + (fee / 10000).toFixed(2) + "%");
  }

  printDec(value: bigint, decimals: number) {
    const mult = BigInt(10 ** decimals);
    const whole = value / mult;
    const part = (value % mult) + mult;
    return whole + "." + part.toString().slice(1);
  }

  printSwapPath(path: Hex) {
    const bytes = hexToBytes(path);
    let fromTok = getAddress(bytesToHex(bytes.slice(0, 20)));
    for (let i = 20; i < bytes.length; i += 23) {
      const fee = Number(bytesToBigInt(bytes.slice(i, i + 3)));
      const toTok = getAddress(bytesToHex(bytes.slice(i + 3, i + 23)));
      const percent = (fee / 10000).toFixed(2);
      const from = this.getSymbol(fromTok);
      const to = this.getSymbol(toTok);
      console.log(`  Pool: ${from}-${to} ${percent}%`);
      fromTok = toTok;
    }
  }

  getSymbol(addr: Address) {
    return this.tokens.find((t) => t.token === addr)?.symbol || addr;
  }
}

main().catch(console.error);
