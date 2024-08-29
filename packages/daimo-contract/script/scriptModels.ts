import { Address } from "viem";

export type ChainlinkFeed = {
  chainId: number;
  tokenSymbol: string;
  feedAddress: Address;
  feedDecimals: number;
};

export type PricedToken = {
  chainId: number;
  tokenSymbol: string;
  tokenAddress: Address;
  tokenName: string;
  tokenDecimals: number;
  logoURI?: string;
  blockNumber: number;
  blockTimestamp: number;
  uniswapPrice?: number;
  chainlinkFeedAddress?: Address;
  chainlinkDecimals?: number;
  chainlinkPrice?: number;
  chainlinkAgeS?: number;
  diffPercent?: number;
  status: string;
};
