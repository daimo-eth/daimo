import dotenv from "dotenv";

dotenv.config();

// Shovel Squared indexer runs on multiple chains
export const shovelSquaredSourceNames: string[] =
  process.env.SHOVEL_SQUARED_SOURCE_NAMES?.split(",") ?? [];

// Shovel indexer runs only on Base / Base Sepolia
export const shovelSourceName: string = process.env.SHOVEL_SOURCE_NAME ?? "";

export type ShovelSource = {
  chainId: number;
  alchemyEndpoint: string;
  quicknodeEndpoint: string;
  chainstackEndpoint: string;
  startBlock: number;
};

// TODO: check if all the quicknode chain endpoint configs are the same as alchemy
export const shovelSources = {
  base: {
    chainId: 8453,
    alchemyEndpoint: "base-mainnet",
    quicknodeEndpoint: "base-mainnet",
    chainstackEndpoint: "nd-455-316-764",
    start: "$BASE_START_BLOCK",
  },
  optimism: {
    chainId: 10,
    alchemyEndpoint: "opt-mainnet",
    quicknodeEndpoint: "opt-mainnet",
    chainstackEndpoint: "nd-455-316-764", // TODO: check
    start: "$OPTIMISM_START_BLOCK",
  },
  arbitrum: {
    chainId: 42161,
    alchemyEndpoint: "arb-mainnet",
    quicknodeEndpoint: "arb-mainnet",
    chainstackEndpoint: "nd-455-316-764", // TODO: check
    start: "$ARBITRUM_START_BLOCK",
  },
  polygon: {
    chainId: 137,
    alchemyEndpoint: "polygon-mainnet",
    quicknodeEndpoint: "polygon-mainnet",
    chainstackEndpoint: "nd-455-316-764", // TODO: check
    start: "$POLYGON_START_BLOCK",
  },
  avalanche: {
    chainId: 43114,
    alchemyEndpoint: "avax-mainnet",
    quicknodeEndpoint: "avax-mainnet",
    chainstackEndpoint: "nd-455-316-764", // TODO: check
    start: "$AVALANCHE_START_BLOCK",
  },
  ethereum: {
    chainId: 1,
    alchemyEndpoint: "eth-mainnet",
    quicknodeEndpoint: "eth-mainnet",
    chainstackEndpoint: "nd-455-316-764", // TODO: check
    start: "$ETHEREUM_START_BLOCK",
  },
  baseSepolia: {
    chainId: 84532,
    alchemyEndpoint: "base-sepolia",
    quicknodeEndpoint: "base-sepolia",
    chainstackEndpoint: "base-sepolia",
    start: "$BASE_SEPOLIA_START_BLOCK",
  },
  optimismSepolia: {
    chainId: 11155420,
    alchemyEndpoint: "opt-sepolia",
    quicknodeEndpoint: "opt-sepolia",
    chainstackEndpoint: "opt-sepolia",
    start: "$OPTIMISM_SEPOLIA_START_BLOCK",
  },
  arbitrumSepolia: {
    chainId: 421614,
    alchemyEndpoint: "arb-sepolia",
    quicknodeEndpoint: "arb-sepolia",
    chainstackEndpoint: "arb-sepolia",
    start: "$ARBITRUM_SEPOLIA_START_BLOCK",
  },
  polygonAmoy: {
    chainId: 80002,
    alchemyEndpoint: "polygon-amoy",
    quicknodeEndpoint: "polygon-amoy",
    chainstackEndpoint: "polygon-amoy",
    start: "$POLYGON_AMOY_START_BLOCK",
  },
  avalancheFuji: {
    chainId: 43113,
    alchemyEndpoint: "avax-fuji",
    quicknodeEndpoint: "avax-fuji",
    chainstackEndpoint: "avax-fuji",
    start: "$AVALANCHE_FUJI_START_BLOCK",
  },
  ethereumSepolia: {
    chainId: 11155111,
    alchemyEndpoint: "eth-sepolia",
    quicknodeEndpoint: "eth-sepolia",
    chainstackEndpoint: "eth-sepolia",
    start: "$ETHEREUM_SEPOLIA_START_BLOCK",
  },
};

export const integrationSources = shovelSquaredSourceNames.map((name) => ({
  name,
  start: shovelSources[name].start,
}));

export function alchemyRpc(sourceName: string) {
  const chainEndpoint = shovelSources[sourceName].alchemyEndpoint;
  return `${chainEndpoint}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}/`;
}

export function quicknodeRpc(sourceName: string) {
  const chainEndpoint = shovelSources[sourceName].quicknodeEndpoint;
  return `${process.env.QUICKNODE_API_URL}.${chainEndpoint}.quiknode.pro/${process.env.QUICKNODE_API_KEY}`;
}

export function chainstackRpc(sourceName: string) {
  // TODO: add chainstack url endpoint
  const chainEndpoint = shovelSources[sourceName].chainstackEndpoint;
  return `${chainEndpoint}.${process.env.CHAINSTACK_API_URL}.com/${process.env.CHAINSTACK_API_KEY}`;
}
