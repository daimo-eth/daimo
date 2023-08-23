// Random "signature" input of correct length
export const dummySignature =
  "0x00deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (hexMessage: string) => {
  derSig: Promise<string>;
  keyIdx: number;
};
