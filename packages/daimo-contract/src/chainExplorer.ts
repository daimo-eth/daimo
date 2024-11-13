/**
 * Get block explorer URL for chain ID
 */
export function getChainExplorerByChainId(chainId: number): string | undefined {
  switch (chainId) {
    case 1:
      return "https://etherscan.io";
    case 8453:
      return "https://basescan.org";
    case 42161:
      return "https://arbiscan.io";
    case 10:
      return "https://optimistic.etherscan.io";
    case 137:
      return "https://polygonscan.com";
    case 43114:
      return "https://snowtrace.io";
    case 11155111:
      return "https://sepolia.etherscan.io";
    case 84532:
      return "https://sepolia.basescan.org";
    case 421614:
      return "https://sepolia.arbiscan.io";
    case 11155420:
      return "https://sepolia-optimism.etherscan.io";
    case 80002:
      return "https://amoy.polygonscan.com";
    case 43113:
      return "https://testnet.snowtrace.io";
    case 59144:
      return "https://lineascan.build";
    case 56:
      return "https://bscscan.com";
    case 501:
      return "https://solscan.io";
    default:
      return undefined;
  }
}

export function getChainExplorerAddressUrl(chainId: number, address: string) {
  const explorer = getChainExplorerByChainId(chainId);
  if (!explorer) {
    return undefined;
  }
  return `${explorer}/address/${address}`;
}

export function getChainExplorerTxUrl(chainId: number, txHash: string) {
  const explorer = getChainExplorerByChainId(chainId);
  if (!explorer) {
    return undefined;
  }
  return `${explorer}/tx/${txHash}`;
}
