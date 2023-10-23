import { parseAbi } from "viem";

import {
  daimoNameRegistryABI,
  daimoNameRegistryProxyAddress,
} from "./generated";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryABI,
} as const;

export const pimlicoPaymasterAbi = parseAbi([
  "function priceMarkup() view returns (uint32)",
  "function previousPrice() view returns (uint192)",
  "function token() view returns (address)",
]);

export {
  daimoAccountABI,
  daimoEphemeralNotesABI,
  daimoEphemeralNotesAddress,
  daimoEphemeralNotesConfig,
  daimoAccountFactoryABI,
  daimoAccountFactoryAddress,
  daimoAccountFactoryConfig,
  daimoPaymasterAddress,
  erc20ABI,
  entryPointABI,
} from "./generated";

export * from "./chainConfig";
