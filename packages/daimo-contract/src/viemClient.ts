import {
  Address,
  ByteArray,
  bytesToHex,
  Chain,
  extractChain,
  getAddress,
} from "viem";
import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  bsc,
  linea,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  sepolia,
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
      linea,
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
  [linea.id]: "linea-mainnet",
  [bsc.id]: "bnb-mainnet",
};
const supportedChainIds = Object.keys(alchemyChainNames).map(Number);

/** Converts a buffer to a viem Address. Zero-length buffer = zero addr.
 * Any length other than 0 or 20 bytes = throws an error.
 */
export function bytesToAddr(bytes: ByteArray): Address {
  if (bytes.length !== 0 && bytes.length !== 20) {
    throw new Error(`invalid address byte[], got ${bytes.length} bytes`);
  }
  return getAddress(bytesToHex(bytes, { size: 20 }));
}
