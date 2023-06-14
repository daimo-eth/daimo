// Random signature of correct length
export const dummySignature =
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (hexMessage: string) => Promise<string>;
