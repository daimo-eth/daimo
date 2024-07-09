import { getEOA } from "@daimo/api/src/network/viemClient";
import * as dotenv from "dotenv";
import {
  createPublicClient,
  http,
  Chain,
  extractChain,
  PublicClient,
  WalletClient,
  createWalletClient,
  PrivateKeyAccount,
  Address,
} from "viem";
import {
  mainnet,
  sepolia,
  base,
  optimism,
  polygon,
  polygonAmoy,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  optimismSepolia,
  avalanche,
  avalancheFuji,
} from "viem/chains";

dotenv.config();

if (!process.env.DAIMO_API_PRIVATE_KEY) {
  throw new Error("DAIMO_API_PRIVATE_KEY is not set");
}
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error("ALCHEMY_API_KEY is not set");
}

const funderAccount = getEOA(process.env.DAIMO_API_PRIVATE_KEY as string);

/** Viem client type. */
export type ViemClient = {
  publicClient: PublicClient;
  walletClient: WalletClient;
  chain: Chain;
  account: PrivateKeyAccount;
};
const clients = new Map<number, ViemClient>();

/** Get Viem client for chainId. */
export function getViemClient(chainId: number) {
  if (!clients.has(chainId)) {
    clients.set(chainId, createViemClient(chainId));
  }
  return clients.get(chainId)!;
}

/** Create a Viem Client (public client + wallet client) for chainId. */
function createViemClient(chainId: number): ViemClient {
  if (!funderAccount) {
    throw new Error(`[SWAPBOT] Invalid funder account config`);
  }
  const account = funderAccount as PrivateKeyAccount;
  const chain: Chain = getViemChainById(chainId);
  const transportUrl = getTransportUrl(chainId);

  const publicClient = createPublicClient({
    chain,
    transport: http(transportUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(transportUrl),
  });

  return { publicClient, walletClient, chain, account };
}

/** Retrieve the Viem chain config for a given chainId. */
function getViemChainById(chainId: number): Chain {
  if (!supportedChainIds.includes(chainId))
    throw new Error(`Unsupported chainId ${chainId}`);

  return extractChain({
    chains: [
      mainnet,
      sepolia,
      polygon,
      polygonAmoy,
      arbitrum,
      arbitrumSepolia,
      base,
      baseSepolia,
      optimism,
      optimismSepolia,
      avalanche,
      avalancheFuji,
    ],
    id: chainId as any,
  });
}

/** Get the RPC URL for a given chainId. */
function getTransportUrl(chainId: number) {
  // If chainId is AVAX, use public Avalanche RPC (no Alchemy support
  if (chainId === avalanche.id) {
    return "https://avalanche.public-rpc.com";
  } else if (chainId === avalancheFuji.id) {
    return "​https://api.avax-test.network/ext/bc/C/rpc";
  }

  // Otherwise, use Alchemy
  const network = supportedChainNames[chainId];
  if (!network) {
    throw new Error(`Invalid chainId: ${chainId}`);
  }
  const alchemyApiKey = process.env.ALCHEMY_API_KEY;
  const alchemyRpcUrl = `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`;
  return alchemyRpcUrl;
}

// Mapping of chainID to Alchemy network name.
// Note: Avax is not supported by Alchemy.
export const supportedChainNames: Record<number, string> = {
  [mainnet.id]: "eth-mainnet",
  [sepolia.id]: "eth-sepolia",
  [polygon.id]: "polygon-mainnet",
  [polygonAmoy.id]: "polygon-amoy",
  [arbitrum.id]: "arb-mainnet",
  [arbitrumSepolia.id]: "arb-sepolia",
  [base.id]: "base-mainnet",
  [baseSepolia.id]: "base-sepolia",
  [optimism.id]: "opt-mainnet",
  [optimismSepolia.id]: "opt-sepolia",
};
const supportedChainIds = Object.keys(supportedChainNames).map(Number);

/** Retrieve the CCTP Message Trasmitter Address */
export function getCCTPMessageTransmitterAddress(chainId: number): Address {
  switch (chainId) {
    case mainnet.id:
      return "0x0a992d191DEeC32aFe36203Ad87D7d289a738F81";
    case avalanche.id:
      return "0x8186359aF5F57FbB40c6b14A588d2A59C0C29880";
    case optimism.id:
      return "0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8";
    case arbitrum.id:
      return "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca";
    case base.id:
      return "0xAD09780d193884d503182aD4588450C416D6F9D4";
    case polygon.id:
      return "0xF3be9355363857F3e001be68856A2f96b4C39Ba9";
    case sepolia.id:
    case optimismSepolia.id:
    case baseSepolia.id:
      return "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";
    case avalancheFuji.id:
      return "0xa9fB1b3009DCb79E2fe346c16a604B8Fa8aE0a79";
    case arbitrumSepolia.id:
      return "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";
    default:
      throw new Error(`unknown chainId ${chainId}`);
  }
}

export function getCCTPTokenMessengerAddress(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return "0xBd3fa81B58Ba92a82136038B25aDec7066af3155";
    case avalanche.id:
      return "0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982";
    case optimism.id:
      return "0x2B4069517957735bE00ceE0fadAE88a26365528f";
    case arbitrum.id:
      return "0x19330d10D9Cc8751218eaf51E8885D058642E08A";
    case base.id:
      return "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962";
    case sepolia.id:
    case optimismSepolia.id:
    case baseSepolia.id:
    case arbitrumSepolia.id:
      return "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    case avalancheFuji.id:
      return "0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0";
  }
}

export function getCCTPTokenMinterAddress(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return "0xc4922d64a24675E16e1586e3e3Aa56C06fABe907";
    case avalanche.id:
      return "0x420F5035fd5dC62a167E7e7f08B604335aE272b8";
    case optimism.id:
      return "0x33E76C5C31cb928dc6FE6487AB3b2C0769B1A1e3";
    case arbitrum.id:
      return "0xE7Ed1fa7f45D05C508232aa32649D89b73b8bA48";
    case base.id:
      return "0xe45B133ddc64bE80252b0e9c75A8E74EF280eEd6";
    case polygon.id:
      return "0x10f7835F827D6Cf035115E10c50A853d7FB2D2EC";
    case sepolia.id:
    case optimismSepolia.id:
    case baseSepolia.id:
    case arbitrumSepolia.id:
      return "0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A";
    case avalancheFuji.id:
      return "0x4ED8867f9947A5fe140C9dC1c6f207F3489F501E";
  }
}
