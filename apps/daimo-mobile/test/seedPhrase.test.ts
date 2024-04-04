import { isDERPubKey } from "@daimo/common";

import { generateSeedPhrase, reverseSeedPhrase } from "../src/logic/seedPhrase";

describe("Seed Phrase", () => {
  const { mnemonic, publicKey } = generateSeedPhrase();

  it("generates a mnemonic and a public key", () => {
    expect(mnemonic.split(" ").length).toEqual(24);
    expect(isDERPubKey(publicKey)).toEqual(true);
  });

  it("correctly reverses a mnemonic", () => {
    const privateKey = reverseSeedPhrase(mnemonic);

    // TODO: Test that the retrieved *publicKey* matches the one above.
    expect(privateKey).toBeDefined();
  });
});
