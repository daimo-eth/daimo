import { isDERPubKey } from "@daimo/common";

import { generateSeedPhrase } from "../src/logic/seedPhrase";

describe("Seed Phrase", () => {
  it("generates a mnemonic and a public key", () => {
    const { mnemonic, publicKey } = generateSeedPhrase();
    expect(mnemonic.split(" ").length).toEqual(24);
    expect(isDERPubKey(publicKey)).toEqual(true);
  });
});
