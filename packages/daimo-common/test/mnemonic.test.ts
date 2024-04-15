import { p256 } from "@noble/curves/p256";
import assert from "node:assert";
import test from "node:test";
import { toHex } from "viem";

import {
  generateMnemonicKey,
  signWithMnemonic,
} from "../src/mnemonic/mnemonic";

test("seed phrase roundtrips", () => {
  for (let i = 0; i < 100; i++) {
    const mnemonicKey = generateMnemonicKey();

    const randomMessage = toHex(p256.utils.randomPrivateKey());

    const signature = signWithMnemonic(mnemonicKey.mnemonic, randomMessage);

    const correct = p256.verify(
      signature.slice(2),
      randomMessage.slice(2),
      mnemonicKey.publicKey
    );
    assert(correct);

    const wrong = p256.verify(
      signature.slice(2),
      "deadbeef",
      mnemonicKey.publicKey
    );
    assert(!wrong);
  }
});
