import { erc20ABI } from "@daimo/contract";
import { Address, PublicClient, createPublicClient, webSocket } from "viem";
import { base, mainnet, optimism, polygon } from "viem/chains";

let bridge: Bridge | null = null;

export function getDefaultBridge() {
  if (!bridge) {
    bridge = new Bridge();
  }
  return bridge;
}

export interface TokenBalance {
  chainID: number;
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
  private chains = [mainnet, base, optimism, polygon];

  private tokens = [
    {
      chainSlug: "mainnet",
      symbol: "USDT",
      addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    {
      chainSlug: "mainnet",
      symbol: "USDC",
      addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    {
      chainSlug: "mainnet",
      symbol: "DAI",
      addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      decimals: 18,
    },
    {
      chainSlug: "base",
      symbol: "USDC",
      addr: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
    {
      chainSlug: "base",
      symbol: "DAI",
      addr: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      decimals: 18,
    },
    {
      chainSlug: "optimism",
      symbol: "USDT",
      addr: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      decimals: 6,
    },
    {
      chainSlug: "optimism",
      symbol: "USDC.e",
      addr: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      decimals: 6,
    },
    {
      chainSlug: "optimism",
      symbol: "DAI",
      addr: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      decimals: 18,
    },
    {
      chainSlug: "polygon",
      symbol: "USDT",
      addr: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimals: 6,
    },
    {
      chainSlug: "polygon",
      symbol: "USDC.e",
      addr: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      decimals: 6,
    },
    {
      chainSlug: "polygon",
      symbol: "DAI",
      addr: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      decimals: 18,
    },
  ] as const;

  private clients = this.chains.map((chain) => {
    const urlPattern = process.env.DAIMO_BRIDGE_RPC_WS_PATTERN;
    if (!urlPattern) throw new Error("Missing DAIMO_BRIDGE_RPC_WS_PATTERN");
    const slug = getSlug(chain.network);
    const url = urlPattern.replace("CHAIN_NETWORK", slug);

    console.log(`[BRIDGE] connecting to ${slug} at ${url}`);
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
    const { network, name: chainName, id: chainID } = client.chain!;
    const tokens = this.tokens.filter((t) => t.chainSlug === getSlug(network));

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
          chainID,
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

function getSlug(network: string) {
  return network === "homestead" ? "mainnet" : network;
}
