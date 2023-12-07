import { Address, Chain } from "viem";
import { base, baseGoerli, mainnet } from "viem/chains";

export type DaimoChain = "base" | "baseGoerli";

export function daimoChainFromId(chainId: number): DaimoChain {
  switch (chainId) {
    case base.id:
      return "base";
    case baseGoerli.id:
      return "baseGoerli";
    default:
      throw new Error(`unknown chainId ${chainId}`);
  }
}

export interface ChainConfig {
  chainL1: Chain;
  chainL2: Chain;
  tokenAddress: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  pimlicoPaymasterAddress: Address; // Unused, only for backup
}

export function getChainConfig(daimoChain: DaimoChain): ChainConfig {
  switch (daimoChain) {
    case "base":
      return {
        chainL1: mainnet,
        chainL2: base,
        tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        pimlicoPaymasterAddress: "0x939263eAFE57038a072cb4edD6B25dd81A8A6c56",
      };
    case "baseGoerli":
      return {
        chainL1: mainnet, // ENS resolution = eth mainnet, read-only
        chainL2: baseGoerli,
        tokenAddress: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        pimlicoPaymasterAddress: "0x13f490FafBb206440F25760A10C21A6220017fFa",
      };
    default:
      throw new Error(`unknown chain '${daimoChain}'`);
  }
}
