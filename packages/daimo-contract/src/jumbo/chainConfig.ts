import type { Source, SourceReference } from "@indexsupply/shovel-config";

export type ChainConfig = {
  name: string; // chain name
  env: string; // env var prefix
  chainId: number;
};

// Mainnet chains to be used for Jumbo shovel config
export const mainnetChains = [
  {
    name: "base",
    env: "BASE",
    chainId: 8453,
  },
  {
    name: "optimism",
    env: "OPTIMISM",
    chainId: 10,
  },
  {
    name: "arbitrum",
    env: "ARBITRUM",
    chainId: 42161,
  },
  {
    name: "polygon",
    env: "POLYGON",
    chainId: 137,
  },
  {
    name: "avalanche",
    env: "AVAX",
    chainId: 43114,
  },
  {
    name: "ethereum",
    env: "ETH",
    chainId: 1,
  },
];

// Testnet chains to be used for Jumbo shovel config
// Note: for now, only run on chains that support DAv2 with CREATE3 deployment
export const testnetChains = [
  {
    name: "baseSepolia",
    env: "BASE",
    chainId: 84532,
  },
  {
    name: "ethSepolia",
    env: "ETH",
    chainId: 11155111,
  },
  // {
  //   name: "optimismSepolia",
  //   env: "OPTIMISM",
  //   chainId: 11155420,
  // },
  // {
  //   name: "arbitrumSepolia",
  //   env: "ARBITRUM",
  //   chainId: 421614,
  // },
  // {
  //   name: "polygonAmoy",
  //   env: "POLYGON",
  //   chainId: 80002,
  // },
  // {
  //   name: "avalancheFuji",
  //   env: "AVAX",
  //   chainId: 43113,
  // },
];

// Make the sources for each integration with the given chain info
export const makeIntegrationSources = (
  chains: ChainConfig[],
  trace: boolean = false
): SourceReference[] =>
  chains.map((chain) => ({
    name: trace ? `${chain.name}Trace` : chain.name,
    start: `$${chain.env}_START_BLOCK`,
  }));

// Make the source and trace configs for all given chains
export const makeAllSourceConfigs = (chains: ChainConfig[]): Source[] =>
  chains.flatMap((chain) => [
    {
      name: chain.name,
      chain_id: chain.chainId,
      ws_url: `$${chain.env}_ALCHEMY_WS_RPC`,
      urls: [`$${chain.env}_ALCHEMY_RPC`, `$${chain.env}_CHAINSTACK_RPC`],
      batch_size: 100,
      concurrency: 4,
    } as any, // TODO: remove any once @indexsupply/shovel-config updates
    {
      name: `${chain.name}Trace`,
      chain_id: chain.chainId,
      urls: [`$${chain.env}_CHAINSTACK_RPC`],
      batch_size: 32,
      concurrency: 2,
    } as any,
  ]);
