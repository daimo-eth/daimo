import { Address } from "viem";

export type ChainlinkFeed = {
  chainId: number;
  feedAddress: Address;
  tokenSymbol: string;
  tokenAddress: Address;
  decimals: number;
};
