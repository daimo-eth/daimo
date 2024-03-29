export class BotResp {
  static connectFarcasterToContinue() {
    return "Connect your Farcaster on Daimo to continue!";
  }

  static request(
    cleanedAmount: number,
    recipientUsername: string,
    requestUrl: string
  ) {
    const amountStr = cleanedAmount.toFixed(2);
    return [
      `Here's a request for $${amountStr} to @${recipientUsername}!`,
      requestUrl,
    ].join("\n");
  }

  static noDaimoOrEthAccountFound(recipientUsername: string) {
    return `@${recipientUsername} has to first connect their Farcaster on Daimo to receive payments!`;
  }

  static mustReplyToPayOrRequest() {
    return [
      "I can't find who you're trying to pay 🧐",
      "To pay someone, make sure you're replying to one of their casts!",
    ].join("\n");
  }

  static commandNotValid() {
    return "🫡 Didn't catch that. Try something like `@daimobot request $10` or `@daimobot pay $4`";
  }
}
