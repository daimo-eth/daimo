import { extractChain, Chain } from "viem";
import {
  mainnet,
  sepolia,
  base,
  optimism,
  polygon,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  optimismSepolia,
  avalanche,
  avalancheFuji,
} from "viem/chains";

/** Retrieve the Viem chain config for a given chainId. */
export function getViemChainById(chainId: number): Chain {
  if (!supportedChainIds.includes(chainId))
    throw new Error(`Unsupported chainId ${chainId}`);

  return extractChain({
    chains: [
      mainnet,
      sepolia,
      polygon,
      arbitrum,
      arbitrumSepolia,
      base,
      baseSepolia,
      optimism,
      optimismSepolia,
      avalanche,
      avalancheFuji,
    ],
    id: chainId as any,
  });
}

/** Get the RPC URL for a given chainId. */
export function getAlchemyTransportUrl(chainId: number, alchemyApiKey: string) {
  const network = alchemyChainNames[chainId];
  if (!network) {
    throw new Error(`Invalid chainId: ${chainId}`);
  }
  const alchemyRpcUrl = `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`;
  return alchemyRpcUrl;
}

/**
 * Mapping of chainID to Alchemy network name for RPC URLs.
 * Note: Avax is not supported by Alchemy, nor do we support it.
 */
const alchemyChainNames: Record<number, string> = {
  [mainnet.id]: "eth-mainnet",
  [sepolia.id]: "eth-sepolia",
  [polygon.id]: "polygon-mainnet",
  [arbitrum.id]: "arb-mainnet",
  [arbitrumSepolia.id]: "arb-sepolia",
  [base.id]: "base-mainnet",
  [baseSepolia.id]: "base-sepolia",
  [optimism.id]: "opt-mainnet",
  [optimismSepolia.id]: "opt-sepolia",
};
const supportedChainIds = Object.keys(alchemyChainNames).map(Number);
