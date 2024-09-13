import {
  DAv2Chain,
  ForeignToken,
  arbitrum,
  arbitrumUSDC,
  base,
  baseETH,
  baseSepolia,
  baseSepoliaETH,
  baseSepoliaUSDC,
  baseUSDC,
  ethereumSepolia,
  ethereumSepoliaUSDC,
  isTestnetChain,
  optimism,
  optimismUSDC,
  polygon,
  polygonUSDC,
} from "@daimo/contract";

// Supported Chain <> Coin send pair (any coin, any chain)
export type SendPair = {
  chain: DAv2Chain;
  coin: ForeignToken;
};

const supportedSendPairsMainnet: SendPair[] = [
  { chain: base, coin: baseUSDC },
  { chain: optimism, coin: optimismUSDC },
  { chain: polygon, coin: polygonUSDC },
  { chain: arbitrum, coin: arbitrumUSDC },
  { chain: base, coin: baseETH },
];

const supportedSendPairsTestnet: SendPair[] = [
  { chain: baseSepolia, coin: baseSepoliaUSDC },
  { chain: ethereumSepolia, coin: ethereumSepoliaUSDC },
  { chain: baseSepolia, coin: baseSepoliaETH },
];

export const getSupportedSendPairs = (chainId: number): SendPair[] => {
  return isTestnetChain(chainId)
    ? supportedSendPairsTestnet
    : supportedSendPairsMainnet;
};
