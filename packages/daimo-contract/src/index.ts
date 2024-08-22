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
  daimoFastCctpAddress,
  entryPointABI,
  erc20ABI,
  swapbotLpABI,
} from "./codegen/contracts";

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
