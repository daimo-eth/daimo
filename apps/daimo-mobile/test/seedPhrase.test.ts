import { isDERPubKey } from "@daimo/common";

import { generateSeedPhrase, reverseSeedPhrase } from "../src/logic/seedPhrase";
import { wordlist } from "../src/logic/wordlist";

describe("Seed Phrase", () => {
  const { mnemonic, publicKey } = generateSeedPhrase();

  it("generates a mnemonic and a public key", () => {
    expect(mnemonic.split(" ").length).toEqual(24);
    expect(isDERPubKey(publicKey)).toEqual(true);
  });

  it("conforms to the wordlist", () => {
    const words = mnemonic.split(" ");
    for (const word of words) {
      expect(wordlist).toContain(word);
    }
  });

  it("correctly reverses a mnemonic", () => {
    const publicKeyDER = reverseSeedPhrase(mnemonic);

    expect(publicKeyDER).toEqual(publicKey);
  });
});
