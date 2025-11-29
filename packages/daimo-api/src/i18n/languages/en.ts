export const en = {
  // RecommendedExchange
  recommendedExchange: {
    bridge: {
      cta: () => "Bridge coins from any wallet",
      title: () => "Transfer from another chain",
    },
    coinbase: {
      cta: () => "Deposit from Coinbase",
      title: () => "Send from Coinbase & other options",
    },
    ramp: {
      cta: () => "Buy USDC",
      title: () => "Cards, banks, & international options",
    },
  },

  // SuggestedActions
  suggestedActions: {
    shutdown: {
      title: () => "Shutdown Notice",
      subtitle: () =>
        "We are sunsetting the Daimo app on Jan 31, 2026. Please withdraw funds. Tap for details.",
    },
  },
};

export type LanguageDefinition = typeof en;
