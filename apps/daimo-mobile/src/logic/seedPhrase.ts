import { assert } from "@daimo/common";
import { p256 } from "@noble/curves/p256";
import { bytesToHex } from "viem";

const wordlist = [""];

// Encode private key to seed phrase
export function encodeSeedPhrase() {
  // Generate key pair
  const privateKey = p256.utils.randomPrivateKey();
  const publicKey = p256.getPublicKey(privateKey);

  console.log("LENGTHO: ", privateKey.length);

  const privateKeyString = bytesToHex(privateKey);
  const mnemonic = privateKeyToMnemonic(privateKey);

  return { mnemonic, publicKey };
}

// Checksum is a 8-element Uint8Array defined by the function:
// f(i) = floor(avg(privateKey[i]...privateKey[i+4]))
// Checksum = [f(0)...f(7)]

function getChecksum(privateKey: Uint8Array) {
  assert(privateKey.length === 32, "Invalid private key length");

  const checksum: number[] = [];

  for (let i = 0; i < privateKey.length; i += 4) {
    checksum.push(
      Math.floor(
        privateKey.slice(i, i + 4).reduce((acc, next) => acc + next, 0) / 4
      )
    );
  }

  assert(checksum.length === 8, "Error generating valid checksum");

  return new Uint8Array(checksum);
}

function privateKeyToMnemonic(privateKey: Uint8Array) {
  console.log({ privateKey });
  // We want this to be a multiple of 10

  // Pad with checksum
  const privateKeyWithChecksum = new Uint8Array([
    ...privateKey,
    ...getChecksum(privateKey),
  ]);

  // Cut into segments
  for (const part of privateKeyWithChecksum) {
    // Map "part" to a word in wordlist.
  }

  return "";
}

function validateChecksum(privateKey: Uint8Array, checksum: Uint8Array) {
  assert(privateKey.length === 32, "Invallid private key retrieved");
  assert(checksum.length === 8, "Invalid checksum retrieved");

  const test = [];

  for (let i = 0; i < privateKey.length; i += 4) {
    const x = Math.floor(
      privateKey.slice(i, i + 4).reduce((acc, next) => acc + next, 0) / 4
    );

    test[i / 4] = x === checksum[i / 4];
  }

  return test.every((x) => x);
}

// For account recovery:
// Decode private key from seed phrase
function mnemonicToPrivateKey(mnemonic: string) {
  const wordBytes = [];

  for (const word of mnemonic.split(" ")) {
    // Retrieve bytes from word
  }

  const retrieved = new Uint8Array();

  const privateKey = new Uint8Array(retrieved.slice(0, 32));
  const checksum = new Uint8Array(retrieved.slice(-8));

  validateChecksum(privateKey, checksum);
}
