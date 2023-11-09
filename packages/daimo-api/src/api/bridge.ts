import { erc20ABI } from "@daimo/contract";
import { Address, PublicClient, createPublicClient, webSocket } from "viem";
import { base, mainnet, optimism } from "viem/chains";

let bridge: Bridge | null = null;

export function getDefaultBridge() {
  if (!bridge) {
    bridge = new Bridge();
  }
  return bridge;
}

export interface TokenBalance {
  chainNetwork: string;
  chainName: string;
  tokenAddr: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  ownerAddr: Address;
  balance: `${bigint}`;
}

export class Bridge {
  // private chains = [mainnet, base, arbitrum, arbitrumNova, optimism, polygon];
  private chains = [mainnet, base, optimism];

  private tokens = [
    {
      chainNetwork: "mainnet",
      symbol: "USDT",
      addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    {
      chainNetwork: "mainnet",
      symbol: "USDC",
      addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    {
      chainNetwork: "mainnet",
      symbol: "DAI",
      addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      decimals: 18,
    },
    {
      chainNetwork: "base",
      symbol: "USDC",
      addr: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
    {
      chainNetwork: "base",
      symbol: "DAI",
      addr: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      decimals: 18,
    },
    {
      chainNetwork: "optimism",
      symbol: "USDT",
      addr: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      decimals: 6,
    },
    {
      chainNetwork: "optimism",
      symbol: "USDC.e",
      addr: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      decimals: 6,
    },
    {
      chainNetwork: "optimism",
      symbol: "DAI",
      addr: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      decimals: 18,
    },
  ] as const;

  private clients = this.chains.map((chain) => {
    const urlPattern = process.env.DAIMO_BRIDGE_RPC_WS_PATTERN;
    if (!urlPattern) throw new Error("Missing DAIMO_BRIDGE_RPC_WS_PATTERN");
    const url = urlPattern.replace("CHAIN_NETWORK", chain.network);

    console.log(`[BRIDGE] connecting to ${chain.network} at ${url}`);
    const transport = webSocket(url);
    const publicClient = createPublicClient({ chain, transport });
    return publicClient;
  }) as PublicClient[];

  async getAvailableAssets(addr: Address) {
    const arrays = await Promise.all(
      this.clients.map((client) => this.getChainAssets(client, addr))
    );
    const ret = ([] as TokenBalance[]).concat(...arrays);

    console.log(`[BRIDGE] got balances for ${addr}: ${JSON.stringify(ret)}`);
    return ret;
  }

  async getChainAssets(client: PublicClient, addr: Address) {
    const { network, name: chainName } = client.chain!;
    const tokens = this.tokens.filter((t) => t.chainNetwork === network);

    console.log(`[BRIDGE] fetch ${tokens.length} balances ${network} ${addr}`);
    const ret: TokenBalance[] = await Promise.all(
      tokens.map(async (token) => {
        const result = await client.readContract({
          abi: erc20ABI,
          address: token.addr,
          functionName: "balanceOf",
          args: [addr],
        });

        return {
          balance: `${result}`,
          chainName,
          chainNetwork: network,
          tokenDecimals: token.decimals,
          tokenSymbol: token.symbol,
          tokenAddr: token.addr,
          ownerAddr: addr,
        };
      })
    );

    return ret;
  }
}
