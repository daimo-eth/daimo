// Random "signature" input of correct length
export const dummySignature =
  "0x00deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (
  hexMessage: string
) => Promise<{ derSig: string; keySlot: number }>;
