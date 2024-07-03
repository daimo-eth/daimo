import {
  mainnet,
  sepolia,
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

// NOTE: todo add polygon amoy

/** Retrieve the Viem chain config for a given chainId. */
export function getViemChainConfig(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return mainnet;
    case sepolia.id:
      return sepolia;
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

/** Retrieve the CCTP Message Trasmitter Address */
export function getCCTPMessageTransmitterAddress(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return "0x0a992d191deec32afe36203ad87d7d289a738f81";
    case avalanche.id:
      return "0x8186359af5f57fbb40c6b14a588d2a59c0c29880";
    case optimism.id:
      return "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8";
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
      return "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79";
    case arbitrumSepolia.id:
      return "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";
    default:
      throw new Error(`unknown chainId ${chainId}`);
  }
}

export function getCCTPTokenMessengerAddress(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return "0xbd3fa81b58ba92a82136038b25adec7066af3155";
    case avalanche.id:
      return "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982";
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
      return "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0";
  }
}

export function getCCTPTokenMinterAddress(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return "0xc4922d64a24675e16e1586e3e3aa56c06fabe907";
    case avalanche.id:
      return "0x420f5035fd5dc62a167e7e7f08b604335ae272b8";
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
      return "0x4ed8867f9947a5fe140c9dc1c6f207f3489f501e";
  }
}
