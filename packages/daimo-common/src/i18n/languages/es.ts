import { LanguageDefinition } from "./en";
import { AddrLabel } from "../../model";

export const es: LanguageDefinition = {
  // format.ts
  format: {
    fee: () => "Tasas:",
  },

  // op.ts
  op: {
    acceptedInboundSwap: (
      readableAmount: string,
      otherCoinSymbol: string,
      homeCoinSymbol: string
    ) => `Aceptado ${readableAmount} ${otherCoinSymbol} como ${homeCoinSymbol}`,
    sentOutboundSwap: (readableAmount: string, coinSymbol: string) =>
      `Envidado ${readableAmount} ${coinSymbol}`,
  },

  // time.ts
  time: {
    now: (long?: boolean) => `${long ? "justo ahora" : "ahora"}`,
    minutesAgo: (minutes: number, long?: boolean) =>
      `${long ? "hace" : ""} ${minutes}m`,
    hoursAgo: (hours: number, long?: boolean) =>
      `${long ? "hace" : ""} ${hours}h`,
    daysAgo: (days: number, long?: boolean) => `${long ? "hace" : ""} ${days}d`,
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
      return `equipo Daimo`;
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
      return `cross-chain instantáneo`;
    default:
      throw new Error(`Invalid AddrLabel: ${type}`);
  }
}
