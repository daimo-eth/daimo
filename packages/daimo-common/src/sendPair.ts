import {
  DAv2Chain,
  arbitrum,
  base,
  baseSepolia,
  ethereumSepolia,
  isTestnetChain,
  optimism,
  polygon,
  ForeignToken,
  arbitrumUSDC,
  baseSepoliaUSDC,
  baseUSDC,
  ethereumSepoliaUSDC,
  optimismUSDC,
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
];

const supportedSendPairsTestnet: SendPair[] = [
  { chain: baseSepolia, coin: baseSepoliaUSDC },
  { chain: ethereumSepolia, coin: ethereumSepoliaUSDC },
];

export const getSupportedSendPairs = (chainId: number): SendPair[] => {
  return isTestnetChain(chainId)
    ? supportedSendPairsTestnet
    : supportedSendPairsMainnet;
};
