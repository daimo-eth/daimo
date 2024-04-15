import { p256 } from "@noble/curves/p256";
import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic as bip39ValidateMnemonic,
} from "@scure/bip39";
import { Hex } from "viem";

import { wordlist } from "./wordlist";
import { assert } from "../assert";

export type MnemonicKey = {
  mnemonic: string;
  publicKey: string;
};

function mnemonicToPrivateKey(mnemonic: string) {
  // BIP-39 stretches entropy to 512 bits, but private keys only use 256 bits.
  const seed = mnemonicToSeedSync(mnemonic).slice(0, 32);
  assert(p256.utils.isValidPrivateKey(seed)); // There may be a ~2^224/2^256 = ~1 in 100 billion chance of a bad key, but we ignore it.
  return seed;
}

export function validateMnemonic(mnemonic: string) {
  return bip39ValidateMnemonic(mnemonic, wordlist);
}

export function generateMnemonicKey() {
  const mn = generateMnemonic(wordlist);
  const privKey = mnemonicToPrivateKey(mn);

  return { mnemonic: mn, publicKey: p256.getPublicKey(privKey) };
}

export function signWithMnemonic(mnemonic: string, msg: Hex) {
  assert(validateMnemonic(mnemonic));

  const privKey = mnemonicToPrivateKey(mnemonic);

  return `0x${p256.sign(msg.slice(2), privKey).toDERHex()}`;
}
