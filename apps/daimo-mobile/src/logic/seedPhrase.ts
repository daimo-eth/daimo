import { assert, contractFriendlyKeyToDER } from "@daimo/common";
import { p256 } from "@noble/curves/p256";
import * as bip39 from "@scure/bip39";
import { ec } from "elliptic";
import { Hex, bytesToHex } from "viem";

import { wordlist } from "./wordlist";

const p256Curve = new ec("p256");

export function generateSeedPhrase() {
  const entropy = p256.utils.randomPrivateKey();
  const publicKey = bytesToHex(p256.getPublicKey(entropy));
  const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);

  const [x, y] = getPublicKeyCoordinates(publicKey);
  const publicKeyDER = contractFriendlyKeyToDER([x, y]);

  return { mnemonic, publicKey: publicKeyDER };
}

function getPublicKeyCoordinates(publicKey: Hex): [Hex, Hex] {
  const publicKeyPoint = p256Curve
    .keyFromPublic(publicKey.slice(2), "hex")
    .getPublic();

  const x = `0x${publicKeyPoint.getX().toString(16)}` as Hex;
  const y = `0x${publicKeyPoint.getY().toString(16)}` as Hex;

  return [x, y];
}

export function reverseSeedPhrase(mnemonic: string) {
  const entropy = bip39.mnemonicToEntropy(mnemonic, wordlist);
  const publicKey = bytesToHex(p256.getPublicKey(entropy));

  const [x, y] = getPublicKeyCoordinates(publicKey);
  const publicKeyDER = contractFriendlyKeyToDER([x, y]);

  return publicKeyDER;
}

// Unlike the `requestPasskeySignature` method,
// this does not provide an easy way to get the account name, key slot,
// or other related information.
// It is completely context-free, as it is not stored on the device.

export function requestSeedPhraseSignature(
  challengeB64: string,
  seedPhrase: string
) {
  const entropy = bip39.mnemonicToEntropy(seedPhrase, wordlist);

  assert(
    p256.utils.isValidPrivateKey(entropy),
    "The entered phrase does not match a valid p256 private key"
  );

  return p256.sign(challengeB64, entropy).toDERHex();
}