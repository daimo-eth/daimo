import {
  arbitrum,
  avalanche,
  base,
  baseSepolia,
  ethereum,
  ethereumSepolia,
  optimism,
  polygon,
} from "@daimo/contract";
import { Address, getAddress } from "viem";

const chainToCctpMessengerAddr: Record<number, Address> = {
  // https://developers.circle.com/stablecoins/docs/evm-smart-contracts#mainnet-contract-addresses
  [ethereum.chainId]: getAddress("0xbd3fa81b58ba92a82136038b25adec7066af3155"),
  [arbitrum.chainId]: getAddress("0x19330d10D9Cc8751218eaf51E8885D058642E08A"),
  [avalanche.chainId]: getAddress("0x6b25532e1060ce10cc3b0a99e5683b91bfde6982"),
  [base.chainId]: getAddress("0x1682Ae6375C4E4A97e4B583BC394c861A46D8962"),
  [optimism.chainId]: getAddress("0x2B4069517957735bE00ceE0fadAE88a26365528f"),
  [polygon.chainId]: getAddress("0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE"),

  // https://developers.circle.com/stablecoins/docs/evm-smart-contracts#testnet-contract-addresses
  [ethereumSepolia.chainId]: getAddress(
    "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5"
  ),
  [baseSepolia.chainId]: getAddress(
    "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5"
  ),
} as const;

export function getCctpMessengerAddr(chainId: number) {
  return chainToCctpMessengerAddr[chainId];
}
