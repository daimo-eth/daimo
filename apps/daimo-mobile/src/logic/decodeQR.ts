import { formatDaimoLinkDirect, parseDaimoLink } from "@daimo/common";
import { getAddress, isAddress } from "viem";

// Parse scanned QR code from Daimo or other wallet. On success, returns a
// daimo:// direct deeplink. On failure, returns null.
export function decodeQR(data: string): string | null {
  console.log(`[SCAN] parsing QR data '${data}'`);
  if (data.startsWith("ethereum:")) {
    // Metamask-style ethereum: link
    const m = /^ethereum:(0x[0-9a-fA-F]{40})(@([^/]+)(\/.*)?)?$/.exec(data);

    if (m != null && m[4] != null) {
      // Coinbase-style ethereum: link, with a /(function) call
      const contract = getAddress(m[1]);
      const chain = Number(m[3]);

      const isUSDC = [
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
      ].includes(contract);
      const isBase = chain === 8453;
      const isTransfer = m[4].startsWith("/transfer?address=");
      if (isUSDC && isBase && isTransfer) {
        data = m[4].slice("/transfer?address=".length);
      }
    } else if (m != null) {
      // Metamask-style ethereum: link, no /(function) call
      data = m[1];
    }
  } else if (data.startsWith("eth:")) {
    data = data.slice("eth:".length);
  } else if (data.startsWith("base:")) {
    data = data.slice("base:".length);
  }
  if (isAddress(data)) {
    const addr = getAddress(data); // Convert to checksummed address
    console.log(`[SCAN] opening address ${addr}`);
    return formatDaimoLinkDirect({
      type: "account",
      account: addr,
    });
  } else {
    const universalURL = parseDaimoLink(data);
    // Workaround potential deep linking / AASA bugs by using direct links only
    return universalURL ? formatDaimoLinkDirect(universalURL) : null;
  }
}
