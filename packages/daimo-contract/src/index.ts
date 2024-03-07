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

export const teamDaimoFaucetAddr = "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7";

export {
  daimoAccountABI,
  daimoRequestABI,
  daimoRequestAddress,
  daimoRequestConfig,
  daimoAccountFactoryABI,
  daimoAccountFactoryAddress,
  daimoAccountFactoryConfig,
  daimoEphemeralNotesABI,
  daimoEphemeralNotesV2ABI,
  daimoPaymasterV2Address,
  daimoPaymasterV2ABI,
  entryPointABI,
  erc20ABI,
} from "./generated";

export * from "./chainConfig";
