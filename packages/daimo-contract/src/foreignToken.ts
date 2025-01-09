import { Address, getAddress, zeroAddress } from "viem";

import codegenTokens from "./codegen/tokens.json";

// All known ERC-20 tokens on supported chains.
//
// USDC token addresses taken from:
// Mainnet: https://developers.circle.com/stablecoins/docs/usdc-on-main-networks
// Testnet: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
//
// WETH reference:
// https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/entities/weth9.ts
//
// For all others, see the codegen.

/** Any ERC-20 or SPL token on any chain. */
export type ForeignToken = {
  chainId: number;
  token: string;
  name?: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export enum TokenLogo {
  ETH = "https://pay.daimo.com/chain-logos/ethereum.png",
  USDC = "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  EURC = "https://assets.coingecko.com/coins/images/26045/large/euro.png",
  USDT = "https://pay.daimo.com/coin-logos/usdt.png",
  DAI = "https://pay.daimo.com/coin-logos/dai.png",
  MATIC = "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  AVAX = "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
  BNB = "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  SOL = "https://solana.com/src/img/branding/solanaLogoMark.png",
  WLD = "https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg",
  USDB = "https://assets.coingecko.com/coins/images/35595/large/65c67f0ebf2f6a1bd0feb13c_usdb-icon-yellow.png",
  BLAST = "https://assets.coingecko.com/coins/images/35494/large/Blast.jpg",
}

/* --------------------- Tokens Constants --------------------- */

const usdcByChainId: Map<number, ForeignToken> = new Map();
const axlUSDCByChainId: Map<number, ForeignToken> = new Map();
const daiByChainId: Map<number, ForeignToken> = new Map();

//
// Eth Sepolia
//

export const ethereumSepoliaETH = nativeETH(11155111);

export const ethereumSepoliaWETH: ForeignToken = {
  chainId: 11155111,
  token: getAddress("0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const ethereumSepoliaUSDC: ForeignToken = {
  chainId: 11155111,
  token: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const ethereumSepoliaTokens = [
  ethereumSepoliaETH,
  ethereumSepoliaWETH,
  ethereumSepoliaUSDC,
];

usdcByChainId.set(11155111, ethereumSepoliaUSDC);

//
// Eth Mainnet
//

export const ethereumETH = nativeETH(1);

export const ethereumWETH: ForeignToken = {
  chainId: 1,
  token: getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const ethereumUSDC: ForeignToken = {
  chainId: 1,
  token: getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const ethereumDAI: ForeignToken = {
  chainId: 1,
  token: getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  decimals: 18,
  name: "Dai Stablecoin",
  symbol: "DAI",
  logoURI: TokenLogo.DAI,
};

export const ethereumUSDT: ForeignToken = {
  chainId: 1,
  token: getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  decimals: 6,
  name: "Tether USD",
  symbol: "USDT",
  logoURI: TokenLogo.USDT,
};

export const ethereumEURC: ForeignToken = {
  chainId: 1,
  token: getAddress("0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c"),
  decimals: 6,
  name: "EURC",
  symbol: "EURC",
  logoURI: TokenLogo.EURC,
};

const ethereumTokens = [
  ethereumETH,
  ethereumWETH,
  ethereumUSDC,
  ethereumEURC,
  ethereumDAI,
  ethereumUSDT,
];

usdcByChainId.set(1, ethereumUSDC);
daiByChainId.set(1, ethereumDAI);

//
// Base Sepolia
//

export const baseSepoliaETH = nativeETH(84532);

export const baseSepoliaWETH: ForeignToken = {
  chainId: 84532,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseSepoliaUSDC: ForeignToken = {
  chainId: 84532,
  token: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const baseSepoliaTokens = [baseSepoliaETH, baseSepoliaWETH, baseSepoliaUSDC];

usdcByChainId.set(84532, baseSepoliaUSDC);

//
// Base Mainnet
//

export const baseETH = nativeETH(8453);

export const baseWETH: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseUSDC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const baseEURC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42"),
  decimals: 6,
  name: "EURC",
  symbol: "EURC",
  logoURI: TokenLogo.EURC,
};

export const baseUSDbC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"),
  name: "Bridged USD Coin", // USDbC has a bad name & logo on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`,
};

export const baseDAI: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"),
  name: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI: TokenLogo.DAI,
};

export const baseUSDT: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"),
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  logoURI: TokenLogo.USDT,
};

export const baseAxlUSDC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xEB466342C4d449BC9f53A865D5Cb90586f405215"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

const baseTokens = [
  baseETH,
  baseWETH,
  baseUSDC,
  baseEURC,
  baseUSDbC,
  baseDAI,
  baseUSDT,
  baseAxlUSDC,
];

usdcByChainId.set(8453, baseUSDC);
axlUSDCByChainId.set(8453, baseAxlUSDC);
daiByChainId.set(8453, baseDAI);

//
// Arbitrum Mainnet
//

export const arbitrumETH = nativeETH(42161);

export const arbitrumWETH: ForeignToken = {
  chainId: 42161,
  token: getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const arbitrumUSDC: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const arbitrumAxlUSDC: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xEB466342C4d449BC9f53A865D5Cb90586f405215"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

export const arbitrumDAI: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"),
  decimals: 18,
  name: "Dai Stablecoin",
  symbol: "DAI",
  logoURI: TokenLogo.DAI,
};

export const arbitrumUSDT: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"),
  decimals: 6,
  name: "Tether USD",
  symbol: "USDT",
  logoURI: TokenLogo.USDT,
};

export const arbitrumUSDCe: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
  decimals: 6,
  name: "Bridged USD Coin",
  symbol: "USDCe",
  logoURI: TokenLogo.USDC,
};

const arbitrumTokens = [
  arbitrumETH,
  arbitrumWETH,
  arbitrumUSDC,
  arbitrumAxlUSDC,
  arbitrumDAI,
  arbitrumUSDT,
  arbitrumUSDCe,
];

usdcByChainId.set(42161, arbitrumUSDC);
axlUSDCByChainId.set(42161, arbitrumAxlUSDC);
daiByChainId.set(42161, arbitrumDAI);

//
// Arbitrum Sepolia
//

export const arbitrumSepoliaETH = nativeETH(421614);

export const arbitrumSepoliaWETH: ForeignToken = {
  chainId: 421614,
  token: getAddress("0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const arbitrumSepoliaUSDC: ForeignToken = {
  chainId: 421614,
  token: getAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const arbitrumSepoliaTokens = [
  arbitrumSepoliaETH,
  arbitrumSepoliaWETH,
  arbitrumSepoliaUSDC,
];

usdcByChainId.set(421614, arbitrumSepoliaUSDC);

//
// Optimism Mainnet
//

export const optimismETH = nativeETH(10);

export const optimismWETH: ForeignToken = {
  chainId: 10,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const optimismUSDC: ForeignToken = {
  chainId: 10,
  token: getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const optimismAxlUSDC: ForeignToken = {
  chainId: 10,
  token: getAddress("0xEB466342C4d449BC9f53A865D5Cb90586f405215"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

export const optimismDAI: ForeignToken = {
  chainId: 10,
  token: getAddress("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"),
  decimals: 18,
  name: "Dai Stablecoin",
  symbol: "DAI",
  logoURI: TokenLogo.DAI,
};

export const optimismUSDT: ForeignToken = {
  chainId: 10,
  token: getAddress("0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"),
  decimals: 6,
  name: "Tether USD",
  symbol: "USDT",
  logoURI: TokenLogo.USDT,
};

export const optimismUSDCe: ForeignToken = {
  chainId: 10,
  token: getAddress("0x7F5c764cBc14f9669B88837ca1490cCa17c31607"),
  decimals: 6,
  name: "Bridged USD Coin",
  symbol: "USDCe",
  logoURI: TokenLogo.USDC,
};

const optimismTokens = [
  optimismETH,
  optimismWETH,
  optimismUSDC,
  optimismAxlUSDC,
  optimismDAI,
  optimismUSDT,
  optimismUSDCe,
];

usdcByChainId.set(10, optimismUSDC);
axlUSDCByChainId.set(10, optimismAxlUSDC);
daiByChainId.set(10, optimismDAI);

//
// Optimism Sepolia
//

export const optimismSepoliaETH = nativeETH(11155420);

export const optimismSepoliaWETH: ForeignToken = {
  chainId: 11155420,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const optimismSepoliaUSDC: ForeignToken = {
  chainId: 11155420,
  token: getAddress("0x5fd84259d66Cd46123540766Be93DFE6D43130D7"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const optimismSepoliaTokens = [
  optimismSepoliaETH,
  optimismSepoliaWETH,
  optimismSepoliaUSDC,
];

usdcByChainId.set(11155420, optimismSepoliaUSDC);

//
// Polygon Mainnet
//

export const polygonMATIC = nativeToken(137, "MATIC", "MATIC", TokenLogo.MATIC);

export const polygonWMATIC: ForeignToken = {
  chainId: 137,
  token: getAddress("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"),
  decimals: 18,
  name: "Wrapped Matic",
  symbol: "WMATIC",
  logoURI: TokenLogo.MATIC,
};

export const polygonWETH: ForeignToken = {
  chainId: 137,
  token: getAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const polygonUSDC: ForeignToken = {
  chainId: 137,
  token: getAddress("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const polygonAxlUSDC: ForeignToken = {
  chainId: 137,
  token: getAddress("0x750e4C4984a9e0f12978eA6742Bc1c5D248f40ed"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

export const polygonDAI: ForeignToken = {
  chainId: 137,
  token: getAddress("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"),
  decimals: 18,
  name: "Dai Stablecoin",
  symbol: "DAI",
  logoURI: TokenLogo.DAI,
};

export const polygonUSDT: ForeignToken = {
  chainId: 137,
  token: getAddress("0xc2132D05D31c914a87C6611C10748AEb04B58e8F"),
  decimals: 6,
  name: "Tether USD",
  symbol: "USDT",
  logoURI: TokenLogo.USDT,
};

export const polygonUSDCe: ForeignToken = {
  chainId: 137,
  token: getAddress("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"),
  decimals: 6,
  name: "Bridged USD Coin",
  symbol: "USDCe",
  logoURI: TokenLogo.USDC,
};

const polygonTokens = [
  polygonMATIC,
  polygonWMATIC,
  polygonWETH,
  polygonUSDC,
  polygonAxlUSDC,
  polygonDAI,
  polygonUSDT,
  polygonUSDCe,
];

usdcByChainId.set(137, polygonUSDC);
axlUSDCByChainId.set(137, polygonAxlUSDC);
daiByChainId.set(137, polygonDAI);

//
// Polygon Amoy
//

export const polygonAmoyMATIC = nativeToken(
  80002,
  "MATIC",
  "MATIC",
  TokenLogo.MATIC,
);

export const polygonAmoyWMATIC: ForeignToken = {
  chainId: 80002,
  token: getAddress("0x360ad4f9a9A8EFe9A8DCB5f461c4Cc1047E1Dcf9"),
  decimals: 18,
  name: "Wrapped Matic",
  symbol: "WMATIC",
  logoURI: TokenLogo.MATIC,
};

export const polygonAmoyUSDC: ForeignToken = {
  chainId: 80002,
  token: getAddress("0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const polygonAmoyTokens = [
  polygonAmoyMATIC,
  polygonAmoyWMATIC,
  polygonAmoyUSDC,
];

usdcByChainId.set(80002, polygonAmoyUSDC);

//
// Avalanche C-chain Mainnet
//

export const avalancheAVAX = nativeToken(43114, "AVAX", "AVAX", TokenLogo.AVAX);

export const avalancheUSDC: ForeignToken = {
  chainId: 43114,
  token: getAddress("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const avalancheWETH: ForeignToken = {
  chainId: 43114,
  token: getAddress("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB"), // WETH.e
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const avalancheWAVAX: ForeignToken = {
  chainId: 43114,
  token: getAddress("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"),
  decimals: 18,
  name: "Wrapped AVAX",
  symbol: "WAVAX",
  logoURI: TokenLogo.AVAX,
};

export const avalancheAxlUSDC: ForeignToken = {
  chainId: 43114,
  token: getAddress("0xfaB550568C688d5D8A52C7d794cb93Edc26eC0eC"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

const avalancheTokens = [
  avalancheAVAX,
  avalancheUSDC,
  avalancheWETH,
  avalancheWAVAX,
];

usdcByChainId.set(43114, avalancheUSDC);
axlUSDCByChainId.set(43114, avalancheAxlUSDC);

//
// Avalanche Fuji
//

export const avalancheFujiAVAX = nativeToken(
  43113,
  "AVAX",
  "AVAX",
  TokenLogo.AVAX,
);

export const avalancheFujiUSDC: ForeignToken = {
  chainId: 43113,
  token: getAddress("0x5425890298aed601595a70AB815c96711a31Bc65"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const avalancheFujiWAVAX: ForeignToken = {
  chainId: 43113,
  token: getAddress("0xd00ae08403B9bbb9124bB305C09058E32C39A48c"),
  decimals: 18,
  name: "Wrapped AVAX",
  symbol: "WAVAX",
  logoURI: TokenLogo.AVAX,
};

const avalancheFujiTokens = [
  avalancheFujiAVAX,
  avalancheFujiUSDC,
  avalancheFujiWAVAX,
];

usdcByChainId.set(43113, avalancheFujiUSDC);

//
// Linea Mainnet
//

export const lineaETH = nativeETH(59144);

export const lineaWETH: ForeignToken = {
  chainId: 59144,
  token: getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const lineaBridgedUSDC: ForeignToken = {
  chainId: 59144,
  token: getAddress("0x176211869cA2b568f2A7D4EE941E073a821EE1ff"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC.e",
  logoURI: TokenLogo.USDC,
};

export const lineaAxlUSDC: ForeignToken = {
  chainId: 59144,
  token: getAddress("0xEB466342C4d449BC9f53A865D5Cb90586f405215"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

export const lineaDAI: ForeignToken = {
  chainId: 59144,
  token: getAddress("0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5"),
  decimals: 18,
  name: "Dai Stablecoin",
  symbol: "DAI",
  logoURI: TokenLogo.DAI,
};

const lineaTokens = [
  lineaETH,
  lineaWETH,
  lineaBridgedUSDC,
  lineaAxlUSDC,
  lineaDAI,
];

axlUSDCByChainId.set(59144, lineaAxlUSDC);
daiByChainId.set(59144, lineaDAI);

//
// BSC Mainnet
//

export const bscBNB = nativeToken(56, "BNB", "BNB", TokenLogo.BNB);

export const bscWBNB: ForeignToken = {
  chainId: 56,
  token: getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"),
  decimals: 18,
  name: "Wrapped BNB",
  symbol: "WBNB",
  logoURI: TokenLogo.BNB,
};

export const bscAxlUSDC: ForeignToken = {
  chainId: 56,
  token: getAddress("0x4268B8F0B87b6Eae5d897996E6b845ddbD99Adf3"),
  decimals: 6,
  name: "Axelar Wrapped USDC",
  symbol: "axlUSDC",
  logoURI: TokenLogo.USDC,
};

export const bscUSDC: ForeignToken = {
  chainId: 56,
  token: getAddress("0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"),
  decimals: 18,
  name: "Binance-Peg USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const bscUSDT: ForeignToken = {
  chainId: 56,
  token: getAddress("0x55d398326f99059fF775485246999027B3197955"),
  decimals: 6,
  name: "Tether USD",
  symbol: "USDT",
  logoURI: TokenLogo.USDT,
};

const bscTokens = [bscBNB, bscWBNB, bscAxlUSDC, bscUSDC, bscUSDT];

usdcByChainId.set(56, bscUSDC);
axlUSDCByChainId.set(56, bscAxlUSDC);

//
// Solana
//

export const solanaUSDC: ForeignToken = {
  chainId: 501,
  token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const solanaWrappedSOL: ForeignToken = {
  chainId: 501,
  token: "So11111111111111111111111111111111111111112",
  decimals: 9,
  name: "Wrapped SOL",
  symbol: "WSOL",
  logoURI: TokenLogo.SOL,
};

export const solanaNativeSol = nativeToken(
  501,
  "Solana",
  "SOL",
  TokenLogo.SOL,
  "11111111111111111111111111111111",
  9,
);

const solanaTokens = [solanaUSDC, solanaWrappedSOL, solanaNativeSol];

usdcByChainId.set(501, solanaUSDC);

//
// Worldchain
//

export const worldchainETH = nativeETH(480);

export const worldchainWETH: ForeignToken = {
  chainId: 480,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const worldchainUSDCe: ForeignToken = {
  chainId: 480,
  token: getAddress("0x79A02482A880bCE3F13e09Da970dC34db4CD24d1"),
  decimals: 6,
  name: "Bridged USD Coin",
  symbol: "USDCe",
  logoURI: TokenLogo.USDC,
};

export const worldchainWLD: ForeignToken = {
  chainId: 480,
  token: getAddress("0x2cFc85d8E48F8EAB294be644d9E25C3030863003"),
  decimals: 18,
  name: "Worldcoin",
  symbol: "WLD",
  logoURI: TokenLogo.WLD,
};

const worldchainTokens = [
  worldchainETH,
  worldchainWETH,
  worldchainUSDCe,
  worldchainWLD,
];

//
// Blast
//

export const blastETH = nativeETH(81457);

export const blastWETH: ForeignToken = {
  chainId: 81457,
  token: getAddress("0x4300000000000000000000000000000000000004"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const blastUSDB: ForeignToken = {
  chainId: 81457,
  token: getAddress("0x4300000000000000000000000000000000000003"),
  decimals: 18,
  name: "USDB",
  symbol: "USDB",
  logoURI: TokenLogo.USDB,
};

// TODO: move to the JSON generated by gen-feeds
export const blastBlast: ForeignToken = {
  chainId: 81457,
  token: getAddress("0xb1a5700fA2358173Fe465e6eA4Ff52E36e88E2ad"),
  decimals: 18,
  name: "Blast",
  symbol: "BLAST",
  logoURI: TokenLogo.BLAST,
};

const blastTokens = [blastETH, blastWETH, blastUSDB, blastBlast];

// --------------------- Native Token Utils ---------------------
//

function nativeETH(chainId: number): ForeignToken {
  return nativeToken(chainId, "Ether", "ETH", TokenLogo.ETH);
}

function nativeToken(
  chainId: number,
  name: string,
  symbol: string,
  logoURI: string,
  token: string = zeroAddress,
  decimals: number = 18,
): ForeignToken {
  return {
    chainId,
    token,
    name,
    decimals,
    symbol,
    logoURI,
  };
}

/* --------------------- Token Utils --------------------- */

const allBasicTokens = [
  ...ethereumSepoliaTokens,
  ...ethereumTokens,
  ...baseSepoliaTokens,
  ...baseTokens,
  ...arbitrumTokens,
  ...arbitrumSepoliaTokens,
  ...optimismTokens,
  ...optimismSepoliaTokens,
  ...polygonTokens,
  ...polygonAmoyTokens,
  ...avalancheTokens,
  ...avalancheFujiTokens,
  ...lineaTokens,
  ...bscTokens,
  ...solanaTokens,
  ...worldchainTokens,
  ...blastTokens,
];

const blacklistedTokens: Record<number, Set<string>> = {
  137: new Set([getAddress("0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc")]), // GAX Liquidity Token Reward (GLTR)
  42161: new Set([getAddress("0x9ed7E4B1BFF939ad473dA5E7a218C771D1569456")]), // GAX Liquidity Token Reward (GLTR)
};

const toKey = (t: ForeignToken) => `${t.chainId}-${t.symbol.toLowerCase()}`;

// Export tokens for each supported chain
const tokensByChainId = new Map<number, ForeignToken[]>();
// ...add all named tokens above
for (const token of allBasicTokens) {
  const toks = tokensByChainId.get(token.chainId) || [];
  tokensByChainId.set(token.chainId, toks);
  toks.push(token);
}
// ...add all tokens codegen'd from token lists
for (const token of codegenTokens as ForeignToken[]) {
  const key = toKey(token);
  const basicToken = allBasicTokens.find((a) => toKey(a) === key);
  if (basicToken != null) {
    // This check fails, CoinGecko includes tokens such as this (symbol "ETH"):
    // https://www.coingecko.com/en/coins/the-infinite-garden
    //
    // const jsonB = toEssentialJSON(basicToken);
    // const jsonT = toEssentialJSON(token);
    // if (jsonB !== jsonT) throw new Error(`Mismatch: ${jsonB} ${jsonT}`);
    //
    // Skip token-list aliases of known, basic tokens.
    continue;
  } else if (blacklistedTokens[token.chainId]?.has(token.token)) {
    // Skip manually-blacklisted tokens
    continue;
  }
  const toks = tokensByChainId.get(token.chainId) || [];
  tokensByChainId.set(token.chainId, toks);
  toks.push(token);
}

/** All known tokens on each supported chain. */
export function getTokensForChain(chainId: number): ForeignToken[] {
  const ret = tokensByChainId.get(chainId);
  if (ret == null) throw new Error(`Unsupported chain ${chainId}`);
  return ret;
}

/** Get the USDC token for a given chain. */
export function getChainUSDC(chainId: number): ForeignToken | undefined {
  return usdcByChainId.get(chainId);
}

/** Get the Axelar Wrapped USDC token for a given chain. */
export function getChainAxlUSDC(chainId: number): ForeignToken | undefined {
  return axlUSDCByChainId.get(chainId);
}

/** Get the DAI token for a given chain. */
export function getChainDAI(chainId: number): ForeignToken | undefined {
  return daiByChainId.get(chainId);
}

/** Get a given token */
export function getTokenByAddress(
  chainId: number,
  addr: Address,
): ForeignToken {
  const ret = getTokensForChain(chainId).find((t) => t.token === addr);
  if (ret == null) throw new Error(`Unknown token ${addr} on chain ${chainId}`);
  return ret;
}
