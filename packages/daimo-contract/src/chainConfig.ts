import { Address, Chain } from "viem";
import { base, baseGoerli, mainnet } from "viem/chains";

export interface ChainConfig {
  chainL1: Chain;
  chainL2: Chain;
  tokenAddress: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  paymasterAddress: Address;
}

export const chainConfig = getChainConfig();

function getChainConfig(): ChainConfig {
  const daimoChain =
    process.env.DAIMO_CHAIN || process.env.NEXT_PUBLIC_DAIMO_CHAIN || "";
  switch (daimoChain) {
    case "base":
      return {
        chainL1: mainnet,
        chainL2: base,
        tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        paymasterAddress: "0x939263eAFE57038a072cb4edD6B25dd81A8A6c56",
      };
    case "baseGoerli":
    case "": // Tests, etc default to testnet
      return {
        chainL1: mainnet, // ENS resolution = eth mainnet, read-only
        chainL2: baseGoerli,
        tokenAddress: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        paymasterAddress: "0x13f490FafBb206440F25760A10C21A6220017fFa",
      };
    default:
      throw new Error(`unknown DAIMO_CHAIN '${daimoChain}'`);
  }
}
