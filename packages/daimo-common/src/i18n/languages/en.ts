import { AddrLabel } from "../../model";

export const en = {
  // format.ts
  format: {
    fee: () => "Fee:",
  },

  // op.ts
  op: {
    acceptedInboundSwap: (
      readableAmount: string,
      otherCoinSymbol: string,
      homeCoinSymbol: string
    ) => `Accepted ${readableAmount} ${otherCoinSymbol} as ${homeCoinSymbol}`,
    sentOutboundSwap: (readableAmount: string, coinSymbol: string) =>
      `Sent ${readableAmount} ${coinSymbol}`,
  },

  // time.ts
  time: {
    now: (long?: boolean) => (long ? "just now" : "now"),
    minutesAgo: (minutes: number, long?: boolean) =>
      `${minutes}m ${long ? "ago" : ""}`,
    hoursAgo: (hours: number, long?: boolean) =>
      `${hours}h ${long ? "ago" : ""}`,
    daysAgo: (days: number, long?: boolean) => `${days}d ${long ? "ago" : ""}`,
  },

  // AddrLabels for account history contacts
  addrLabel: {
    label: (type: AddrLabel) => displayAddrLabel(type),
  },
};
// Addr label display function
function displayAddrLabel(type: AddrLabel): string {
  switch (type) {
    case AddrLabel.Faucet:
      return `team Daimo`;
    case AddrLabel.PaymentLink:
      return `payment link`;
    case AddrLabel.RequestLink:
      return `request link`;
    case AddrLabel.Paymaster:
      return `fee`;
    case AddrLabel.Coinbase:
      return `coinbase`;
    case AddrLabel.Relay:
      return `relay.link`;
    case AddrLabel.LiFi:
      return `li.fi bridge`;
    case AddrLabel.UniswapETHPool:
      return `swapped ETH`;
    case AddrLabel.Binance:
      return `binance`;
    case AddrLabel.FastCCTP:
      return `instant cross-chain`;
    default:
      return `unknown`;
  }
}

export type LanguageDefinition = typeof en;
