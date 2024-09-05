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
    upgrade: {
      title: () => "Upgrade Available",
      subtitle: (latestVersion: string) => `Tap to update to ${latestVersion}`,
    },
    backup: {
      title: () => "Secure Your Account",
      subtitle: () => "Keep your account safe with a passkey backup",
    },
    feedback: {
      title: () => "Feedback? Ideas?",
      subtitle: () => "Join our Telegram group.",
    },
  },
};

export type LanguageDefinition = typeof en;
