export const CONNECT_FC_MESSAGE =
  "Connect your Farcaster on Daimo to continue!";
export const REQUEST_PAYMENT_MESSAGE = (
  cleanedAmount: number,
  recipientUsername: string,
  requestUrl: string
) => {
  return `Here's a request for $${cleanedAmount.toFixed(
    2
  )} to @${recipientUsername}! \n ${requestUrl}`;
};

export const PAYMENT_CONNECT_FC_MESSAGE = (recipientUsername: string) => {
  return `@${recipientUsername} has to first connect their Farcaster on Daimo to receive payments!`;
};

export const PARENT_CAST_AUTHOR_NOT_FOUND =
  "I can't find who you're trying to pay 🧐 \n\n To pay someone, make sure you're replying to one of their casts!";

export const DAIMOBOT_INPUT_COMMAND_NOT_VALID =
  "🫡 Didn't catch that. Try something like `@daimobot request $10` or `@daimobot pay $4`";
