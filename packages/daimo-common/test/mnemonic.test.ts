import { p256 } from "@noble/curves/p256";
import assert from "node:assert";
import test from "node:test";
import { toHex } from "viem";

import {
  generateMnemonicKey,
  signWithMnemonic,
  validateMnemonic,
} from "../src/mnemonic/mnemonic";

test("mnemonic roundtrips", async () => {
  for (let i = 0; i < 100; i++) {
    const mnemonicKey = generateMnemonicKey();
    assert(validateMnemonic(mnemonicKey.mnemonic));

    const badMnemonic = // remove letters
      mnemonicKey.mnemonic.slice(
        0,
        Math.random() * mnemonicKey.mnemonic.length - 1
      );
    assert(!validateMnemonic(badMnemonic));

    const randomMessage = toHex(p256.utils.randomPrivateKey());
    const signature = await signWithMnemonic(
      mnemonicKey.mnemonic,
      randomMessage
    );

    const correct = p256.verify(
      signature.slice(2),
      randomMessage.slice(2),
      mnemonicKey.publicKey.slice(2)
    );
    assert(correct);

    const wrong = p256.verify(
      signature.slice(2),
      "deadbeef",
      mnemonicKey.publicKey.slice(2)
    );
    assert(!wrong);
  }
});
