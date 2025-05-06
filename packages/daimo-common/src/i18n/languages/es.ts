import { LanguageDefinition } from "./en";
import { AddrLabel } from "../../model";

export const es: LanguageDefinition = {
  // format.ts
  format: {
    fee: () => "Tasas:",
  },

  // op.ts
  op: {
    acceptedInbound: (
      readableAmount: string,
      otherCoinSymbol: string,
      homeCoinSymbol: string,
      chain?: string
    ) =>
      `Aceptado ${readableAmount} ${otherCoinSymbol}${
        chain ? ` en ${chain}` : ""
      } como ${homeCoinSymbol}`,
    sentOutbound: (
      readableAmount: string,
      coinSymbol: string,
      chain?: string
    ) =>
      `Envidado ${readableAmount} ${coinSymbol}${chain ? ` en ${chain}` : ""}`,
  },

  // time.ts
  time: {
    soon: () => `pronto`,
    now: () => `ahora`,
    minutesAgo: (minutes: number, long?: boolean) =>
      `${long ? "hace" : ""} ${minutes}m`,
    hoursAgo: (hours: number, long?: boolean) =>
      `${long ? "hace" : ""} ${hours}h`,
    daysAgo: (days: number, long?: boolean) => `${long ? "hace" : ""} ${days}d`,
    inDays: (days: number, long?: boolean) => `${long ? "en" : ""} ${days}d`,
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
      return `equipo daimo`;
    case AddrLabel.PaymentLink:
      return `link de pago`;
    case AddrLabel.RequestLink:
      return `solicitar link`;
    case AddrLabel.Paymaster:
      return `tasa`;
    case AddrLabel.Coinbase:
      return `coinbase`;
    case AddrLabel.Relay:
      return `relay.link`;
    case AddrLabel.LiFi:
      return `puente li.fi`;
    case AddrLabel.UniswapETHPool:
      return `ETH cambiado`;
    case AddrLabel.Binance:
      return `binance`;
    case AddrLabel.FastCCTP:
      return `cross-chain`;
    default:
      throw new Error(`Invalid AddrLabel: ${type}`);
  }
}
