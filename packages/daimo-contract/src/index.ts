import {
  daimoNameRegistryABI,
  daimoNameRegistryProxyAddress,
} from "./generated";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryABI,
} as const;

export * from "./generated";
export * from "./tokenMetadata";
