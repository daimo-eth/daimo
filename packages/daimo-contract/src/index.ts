import { Address } from "viem";
import { mainnet } from "viem/chains";

import {
  daimoFastCctpAbi,
  daimoNameRegistryAbi,
  daimoNameRegistryProxyAddress,
} from "./codegen/contracts";

// Tokens, including chain + address
export * from "./foreignToken";

// Special addrs
export const teamDaimoFaucetAddr = "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7";

// Latest contracts
export {
  aggregatorV2V3InterfaceAbi,
  daimoAccountFactoryV2Abi,
  daimoAccountFactoryV2Address,
  daimoAccountFactoryV2Config,
  daimoAccountV2Abi,
  daimoCctpBridgerAbi,
  daimoEphemeralNotesAbi,
  daimoEphemeralNotesV2Abi,
  daimoFlexSwapperAbi,
  daimoPaymasterV2Abi,
  daimoPaymasterV2Address,
  daimoRequestAbi,
  daimoRequestAddress,
  daimoRequestConfig,
  entryPointAbi,
  erc20Abi,
  swapbotLpAbi,
} from "./codegen/contracts";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryAbi,
} as const;

// CREATE3 addresses

/** Latest DaimoFastCCTP address */
export const daimoFastCctpV1Address =
  "0x92275f59CEB72DD132de54F726f767ab6ba9559f";
export const daimoFastCctpV1Abi = daimoFastCctpAbi;

/** Old DaimoFastCCTP address */
export const daimoFastCctpV0Address =
  "0xAC58C46A40ff5c2cb5e1CD40179CEB8E6207BF0B";
// Abi matches new address.

/** All DaimoFastCCTP addresses */
export const daimoFastCctpAddrs: Address[] = [
  daimoFastCctpV0Address,
  daimoFastCctpV1Address,
];

// DAv2
export const entryPointV07Address =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
export const daimoCctpBridgerAddress =
  "0x97DA4FaA21DA8bab9b0724B854Bd43250F25FF58";

// Mainnet has a different address for flex swapper, one that was deployed long
// ago once without chainlink feeds. Redeploy with chainlink is too expensive
// and we don't need it for now.
export const daimoFlexSwapperUniOnlyAddress = (chainId: number) => {
  if (chainId === mainnet.id)
    return "0x207e87f84cff325715f324d09e63b21a03e53b61";
  else return "0xE7c58dcEe819ca56f5b41E1B627c84420d5cf0cA";
};
export const daimoFlexSwapperAddress = (chainId: number) => {
  if (chainId === mainnet.id)
    return "0x207e87f84cff325715f324d09E63b21a03E53b61";
  else return "0xA9F5d58edb8dF8af90f875eac89AA49C57b87Db8";
};

// DAv1 backcompat
export * from "./backcompat/daimoAccountV1";
export * from "./backcompat/entryPointV06";

// Vendored external contract interfaces
export * from "./external";

// Supported chains and coins
export * from "./chain";
export * from "./chainConfig";

export * from "./cctp";
export * from "./viemClient";
