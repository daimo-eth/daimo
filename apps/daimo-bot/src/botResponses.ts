export const CONNECT_FC_MESSAGE =
  "Connect your Farcaster on Daimo to continue!";
export const REQUEST_PAYMENT_MESSAGE = (
  cleanedAmount: number,
  recipientUsername: string
) => {
  return `Here's a request for $${cleanedAmount} to @${recipientUsername}!`;
};
export const PAYMENT_CONNECT_FC_MESSAGE = (recipientUsername: string) => {
  return `@${recipientUsername} has to first connect their Farcaster on Daimo to receive payments!`;
};
//
