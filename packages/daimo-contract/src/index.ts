import {
  daimoNameRegistryABI,
  daimoNameRegistryProxyAddress,
} from "./codegen/contracts";
import codegenTokens from "./codegen/tokens.json";
import { ForeignToken } from "./foreignToken";

export * from "./foreignToken";

// Export tokens for each supported chain
const tokensByChainId = new Map<number, ForeignToken[]>();
for (const token of codegenTokens as ForeignToken[]) {
  const toks = tokensByChainId.get(token.chainId) || [];
  tokensByChainId.set(token.chainId, toks);
  toks.push(token);
}

export function getTokensForChain(chainId: number): ForeignToken[] {
  const ret = tokensByChainId.get(chainId);
  if (ret == null) throw new Error(`Unsupported chain ${chainId}`);
  return ret;
}

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
  entryPointABI,
  erc20ABI,
  swapbotLpABI,
  aggregatorV2V3InterfaceABI,
} from "./codegen/contracts";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryABI,
} as const;

// CREATE3 addresses
export const daimoFastCctpAddress =
  "0x92275f59CEB72DD132de54F726f767ab6ba9559f";
export const daimoFlexSwapperAddress =
  "0x52A7Fb58f1F26fd57B4a3aAE55d6c51a38A73610";
export const daimoCctpBridgerAddress =
  "0x97DA4FaA21DA8bab9b0724B854Bd43250F25FF58";

// DAv2
export const entryPointV07Address =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// DAv1 backcompat
export * from "./backcompat/daimoAccountV1";
export * from "./backcompat/entryPointV06";

// Vendored external contract interfaces
export * from "./external";

// Supported chains and coins
export * from "./chain";
export * from "./chainConfig";
