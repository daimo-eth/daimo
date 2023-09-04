// Random "signature" input of correct length
// TODO: remove once we upgrade the contract
export const dummySignature =
  "0x00deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (
  hexMessage: string
) => Promise<{ derSig: string; keySlot: number }>;
