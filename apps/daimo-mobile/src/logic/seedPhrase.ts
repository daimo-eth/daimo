import { p256 } from "@noble/curves/p256";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { bytesToHex } from "viem";

export function generateSeedPhrase() {
  const entropy = p256.utils.randomPrivateKey();
  const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);
  const publicKey = bytesToHex(p256.getPublicKey(entropy));

  return { mnemonic, publicKey };
}

export function reverseSeedPhrase(mnemonic: string) {
  const entropy = bip39.mnemonicToEntropy(mnemonic, wordlist);

  return bytesToHex(entropy);
}
