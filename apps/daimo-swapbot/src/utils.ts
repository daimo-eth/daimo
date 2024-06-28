import {
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

export function getViemChainConfig(chainId: number) {
  switch (chainId) {
    case base.id:
      return base;
    case baseSepolia.id:
      return baseSepolia;
    case polygon.id:
      return polygon;
    case arbitrum.id:
      return arbitrum;
    case arbitrumSepolia.id:
      return arbitrumSepolia;
    case optimism.id:
      return optimism;
    case optimismSepolia.id:
      return optimismSepolia;
    case avalanche.id:
      return avalanche;
    case avalancheFuji.id:
      return avalancheFuji;
    default:
      throw new Error(`unknown chainId ${chainId}`);
  }
}
