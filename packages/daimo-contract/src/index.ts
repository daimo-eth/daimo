import { Address } from "viem";

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
  daimoPayAbi,
  daimoPayAcrossBridgerAbi,
  daimoPayBridgerAbi,
  daimoPayCctpBridgerAbi,
  daimoPaymasterV2Abi,
  daimoPaymasterV2Address,
  daimoPayRelayerAbi,
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

/** Daimo Pay main contract address */
export const daimoPayAddress = "0x430EF444ff206C0bD7faE7c1d61A1BF3E0d3ac08";
/** Daimo Pay bridger address */
export const daimoPayBridgerAddress =
  "0x5D3142b72B5A3C1C6ffc0c2687A6FD637F90a4BA";
/** Daimo Pay intent factory address */
export const payIntentFactoryAddress =
  "0x39F91aE72c6cB0F6C8D951D3E120c8C4cE7E3761";
/** Daimo Pay relayer address */
export const daimoPayRelayerAddress =
  "0x872bcFC1b5f05fc1c676Ef1b8Ed6f3526C188caD";

// DAv2
export const entryPointV07Address =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
export const daimoCctpBridgerAddress =
  "0x97DA4FaA21DA8bab9b0724B854Bd43250F25FF58";
export const daimoFlexSwapperAddress =
  "0x52A7Fb58f1F26fd57B4a3aAE55d6c51a38A73610";

// DAv1 backcompat
export * from "./backcompat/daimoAccountV1";
export * from "./backcompat/entryPointV06";

// Vendored external contract interfaces
export * from "./external";

// Supported chains and coins
export * from "./chain";
export * from "./chainConfig";
