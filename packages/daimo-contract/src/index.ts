import {
  daimoNameRegistryABI,
  transparentUpgradeableProxyAddress,
} from "./generated";

export const nameRegistryProxyConfig = {
  address: transparentUpgradeableProxyAddress,
  abi: daimoNameRegistryABI,
} as const;
export * from "./generated";
export * from "./tokenMetadata";
