import {
  daimoNameRegistryABI,
  daimoNameRegistryProxyAddress,
} from "./generated";

export const zeroAddr = "0x0000000000000000000000000000000000000000";
export const teamDaimoFaucetAddr = "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7";

// Latest contracts
export {
  daimoAccountV2ABI,
  daimoAccountFactoryV2ABI,
  daimoAccountFactoryV2Address,
  daimoAccountFactoryV2Config,
  daimoEphemeralNotesABI,
  daimoEphemeralNotesV2ABI,
  daimoPaymasterV2ABI,
  daimoPaymasterV2Address,
  daimoRequestABI,
  daimoRequestAddress,
  daimoRequestConfig,
  daimoCctpBridgerABI,
  daimoFlexSwapperABI,
  daimoFastCctpABI,
  daimoFastCctpAddress,
  entryPointABI,
  erc20ABI,
} from "./generated";
export const daimoFlexSwapperAddress =
  "0xB8F43975bC7221Bb3FF9E0B47eC79324F7c87eD0";
export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryABI,
} as const;

// Other internal contracts
export * from "./legacyAccountV1";

// Vendored external contract interfaces
export * from "./external";

// Supported chains and coins
export * from "./chainConfig";
