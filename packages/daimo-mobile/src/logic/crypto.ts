// TODO: use the secure enclave module. Until then, webcrypto.
// This code is temporary. I originally wrote it as part of Zucast. --DC

import { Buffer } from "buffer";

/** An ECDSA (P256) signing keypair. Pubkey is public, privkey stays in localStorage. */
export interface KeyPair {
  /** WebCrypto keypair */
  pair: CryptoKeyPair;
  /** Raw public key, hex encoded */
  pubKeyHex: string;
}

const p256 = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };

/** Generates an ECDSA signing keypair.  */
export async function generateKeypair(): Promise<KeyPair> {
  console.log(`[CRYPTO] generating signing key`);
  const key = await crypto.subtle.generateKey(p256, true, ["sign", "verify"]);
  return fromPair(key);
}

/** Exports an ECDSA signing keypair to JWK. */
export async function exportKeypair(keypair: KeyPair): Promise<string> {
  const { pair } = keypair;
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return JSON.stringify({ publicKey, privateKey });
}

/** Deserializes an ECDSA signing keypair. */
export async function importKeypair(jwk: string): Promise<KeyPair> {
  console.log(`[CRYPTO] importing signing key`);
  const { publicKey, privateKey } = JSON.parse(jwk);
  const { subtle } = crypto;
  const pair: CryptoKeyPair = {
    publicKey: await subtle.importKey("jwk", publicKey, p256, true, ["verify"]),
    privateKey: await subtle.importKey("jwk", privateKey, p256, true, ["sign"]),
  };
  return fromPair(pair);
}

async function fromPair(pair: CryptoKeyPair): Promise<KeyPair> {
  const rawPubKey = await crypto.subtle.exportKey("raw", pair.publicKey);
  const pubKeyHex = Buffer.from(rawPubKey).toString("hex");
  return { pair, pubKeyHex };
}

// /** Deserializes an ECDSA public key. */
// export async function importPubKey(hex: string): Promise<CryptoKey> {
//   const buf = Buffer.from(hex, "hex");
//   return crypto.subtle.importKey("raw", buf, p256, true, ["verify"]);
// }

// /** Returns a hex-encoded ECDSA P256 signature. */
// export async function sign(privateKey: CryptoKey, message: string) {
//   const msg = new TextEncoder().encode(message);
//   const signature = await crypto.subtle.sign(p256, privateKey, msg);
//   return Buffer.from(signature).toString("hex");
// }

// /** Verifies a ECDSA P256 signature. */
// export async function verifySignature(
//   pubKeyHex: string,
//   signatureHex: string,
//   message: string
// ) {
//   const valid = await crypto.subtle.verify(
//     p256,
//     await importPubKey(pubKeyHex),
//     Buffer.from(signatureHex, "hex"),
//     new TextEncoder().encode(message)
//   );
//   if (!valid) {
//     throw new Error(`Invalid signature`);
//   }
// }
