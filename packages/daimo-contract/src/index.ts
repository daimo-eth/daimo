import { erc20Abi, parseAbi } from "viem";

import {
  daimoAccountAbi,
  daimoAccountFactoryAbi,
  daimoEphemeralNotesAbi,
  daimoEphemeralNotesV2Abi,
  daimoNameRegistryAbi,
  daimoNameRegistryProxyAddress,
  daimoOffchainUtilsAbi,
  daimoPaymasterV2Abi,
  daimoRequestAbi,
  entryPointAbi,
} from "./generated";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryAbi,
} as const;

export const pimlicoPaymasterAbi = parseAbi([
  "function priceMarkup() view returns (uint32)",
  "function previousPrice() view returns (uint192)",
  "function token() view returns (address)",
]);

export const teamDaimoFaucetAddr = "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7";

export const daimoAccountABI = daimoAccountAbi;
export const daimoRequestABI = daimoRequestAbi;
export const daimoAccountFactoryABI = daimoAccountFactoryAbi;
export const daimoEphemeralNotesABI = daimoEphemeralNotesAbi;
export const daimoEphemeralNotesV2ABI = daimoEphemeralNotesV2Abi;
export const daimoPaymasterV2ABI = daimoPaymasterV2Abi;
export const daimoOffchainUtilsABI = daimoOffchainUtilsAbi;
export const entryPointABI = entryPointAbi;
export const erc20ABI = erc20Abi;

export {
  daimoRequestAddress,
  daimoRequestConfig,
  daimoAccountFactoryAddress,
  daimoAccountFactoryConfig,
  daimoPaymasterV2Address,
  daimoOffchainUtilsAddress,
} from "./generated";

export * from "./chainConfig";
