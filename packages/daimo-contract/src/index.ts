import {
  daimoNameRegistryABI,
  daimoNameRegistryProxyAddress,
} from "./generated";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryABI,
} as const;

export const teamDaimoFaucetAddr = "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7";

export const zeroAddr = "0x0000000000000000000000000000000000000000";

export * from "./external";

export * from "./chainConfig";

export {
  daimoAccountABI,
  daimoAccountFactoryABI,
  daimoAccountFactoryAddress,
  daimoAccountFactoryConfig,
  daimoEphemeralNotesABI,
  daimoEphemeralNotesV2ABI,
  daimoPaymasterV2ABI,
  daimoPaymasterV2Address,
  daimoRequestABI,
  daimoRequestAddress,
  daimoRequestConfig,
  daimoUsdcSwapperABI,
  entryPointABI,
  erc20ABI,
} from "./generated";

export * from "./accountV2";
