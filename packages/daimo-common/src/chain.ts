// TODO: add supported daimo cahin infra
export function getChainName(chainId: number): string | undefined {
  switch (chainId) {
    case 8453:
    default:
      return "base";
    case 84532:
      return "baseSepolia";
  }
}
