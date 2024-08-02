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
  swapbotLpABI,
} from "./generated";

// TODO: don't hard code these
export const daimoFlexSwapperAddress =
  "0xB500c071ADcD7bdCC34770958dDB7328F0154869";
export const daimoCctpBridgerAddress =
  "0x9066407f4C4d0c189688cC56eCa8A4a733Febd8D";
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
