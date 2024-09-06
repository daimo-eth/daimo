import { AddrLabel } from "../../model";

export const en = {
  // format.ts
  format: {
    fee: () => "Fee:",
  },

  // op.ts
  op: {
    acceptedInbound: (
      readableAmount: string,
      otherCoinSymbol: string,
      homeCoinSymbol: string,
      chain?: string
    ) =>
      `Accepted ${readableAmount} ${otherCoinSymbol}${
        chain ? ` on ${chain}` : ""
      } as ${homeCoinSymbol}`,
    sentOutbound: (
      readableAmount: string,
      coinSymbol: string,
      chain?: string
    ) => `Sent ${readableAmount} ${coinSymbol}${chain ? ` on ${chain}` : ""}`,
  },

  // time.ts
  time: {
    soon: () => "soon",
    now: (long?: boolean) => `${long ? "just now" : "now"}`,
    minutesAgo: (minutes: number, long?: boolean) =>
      `${minutes}m ${long ? "ago" : ""}`,
    hoursAgo: (hours: number, long?: boolean) =>
      `${hours}h ${long ? "ago" : ""}`,
    daysAgo: (days: number, long?: boolean) => `${days}d ${long ? "ago" : ""}`,
    inDays: (days: number, long?: boolean) => `${long ? "in" : ""} ${days}d`,
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
      return `team daimo`;
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
      return `cross-chain`;
    default:
      return `unknown`;
  }
}

export type LanguageDefinition = typeof en;
