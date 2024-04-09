import { p256 } from "@noble/curves/p256";
import {
  validateMnemonic as bip39ValidateMnemonic,
  generateMnemonic,
  mnemonicToSeedSync,
} from "@scure/bip39";
import { Hex, bytesToHex, sha256 } from "viem";

import { wordlist } from "./wordlist";
import { assert } from "../assert";
import { contractFriendlyKeyToDER } from "../key";

export type MnemonicKey = {
  mnemonic: string;
  publicKeyDER: Hex;
};

function mnemonicToPrivateKey(mnemonic: string) {
  assert(validateMnemonic(mnemonic), "Invalid mnemonic");
  // BIP-39 stretches entropy to 512 bits, but private keys only use 256 bits.
  const seed = mnemonicToSeedSync(mnemonic).slice(0, 32);
  // There may be a ~2^224/2^256 = ~1 in 100 billion chance of a bad key, but we ignore it.
  assert(p256.utils.isValidPrivateKey(seed));
  return seed;
}

export function mnemonicToPublicKey(mnemonic: string): MnemonicKey {
  const privKey = mnemonicToPrivateKey(mnemonic);
  return {
    mnemonic,
    publicKeyDER: privKeyToPubKeyDER(privKey),
  };
}

export function validateMnemonic(mnemonic: string) {
  return bip39ValidateMnemonic(mnemonic, wordlist);
}

export function generateMnemonicKey(): MnemonicKey {
  const mnemonic = generateMnemonic(wordlist);
  const privKey = mnemonicToPrivateKey(mnemonic);

  const publicKeyDER = privKeyToPubKeyDER(privKey); // 65-byte public key

  return { mnemonic, publicKeyDER };
}

function privKeyToPubKeyDER(privKey: Uint8Array): Hex {
  const publicKeyBytes = p256.getPublicKey(privKey, false);
  const x = bytesToHex(publicKeyBytes.subarray(1, 33), { size: 32 });
  const y = bytesToHex(publicKeyBytes.subarray(33, 65), { size: 32 });
  return contractFriendlyKeyToDER([x, y]);
}

export async function signWithMnemonic(
  mnemonic: string,
  msg: Hex
): Promise<Hex> {
  assert(validateMnemonic(mnemonic));

  const privKey = mnemonicToPrivateKey(mnemonic);

  const msgHash = sha256(msg);
  const sig = p256.sign(msgHash.slice(2), privKey);

  return `0x${sig.toDERHex(false)}`;
}
