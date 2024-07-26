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
};
