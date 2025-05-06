import { Hex, bytesToHex, hexToBytes, numberToHex } from "viem";
import { generatePrivateKey } from "viem/accounts";

/*
 * Generates a random nonce: a Daimo nonce has three parts:
 * first 64 bits are metadata interpreted in special way by Daimo.
 * next 128 bits are a randomly generated `key`.
 * last 64 bits are a sequence counter, always 0 for Daimo Accounts.
 */
export class DaimoNonce {
  public metadata: DaimoNonceMetadata;
  public key: Hex;

  public constructor(metadata: DaimoNonceMetadata, passedKey?: Hex) {
    assert(passedKey === undefined || passedKey.length === 2 + 32);
    const key = passedKey ?? (generatePrivateKey().slice(0, 2 + 32) as Hex); // Uses secure random.
    this.metadata = metadata;
    this.key = key;
  }

  public toHex(): Hex {
    const hexMetadata = this.metadata.toHex();
    assert(hexMetadata.length === 2 + 16);
    const nonce = (hexMetadata + this.key.slice(2) + "0000000000000000") as Hex;
    console.log(
      `[OP]: Nonce for metadata = ${hexMetadata}, key = ${this.key}: nonce = ${nonce}`
    );
    return nonce;
  }

  public static fromHex(nonce: Hex): DaimoNonce | undefined {
    const paddedNonce = bytesToHex(hexToBytes(nonce), { size: 64 });
    const hexMetadata = paddedNonce.slice(0, 2 + 16) as Hex;
    const metadata = DaimoNonceMetadata.fromHex(hexMetadata);
    const key = `0x${paddedNonce.slice(2 + 16, 2 + 16 + 32)}` as Hex;
    return metadata ? new DaimoNonce(metadata, key) : undefined;
  }
}

export enum DaimoNonceType {
  Send = 0,
  CreateNote = 1,
  ClaimNote = 2,
  RequestResponse = 3,
  AddKey = 4,
  RemoveKey = 5,
  Swap = 6,
  MAX = 255, // At most one byte
}

export const MAX_NONCE_ID_SIZE_BITS = 56n;
const MAX_NONCE_IDENTIFIER = 2n ** MAX_NONCE_ID_SIZE_BITS - 1n;

// 1 byte for type, 7 for an optional ID used for indexing.
export class DaimoNonceMetadata {
  public nonceType: DaimoNonceType;
  public identifier: bigint;

  public constructor(nonceType: DaimoNonceType, identifier = 0n) {
    this.nonceType = nonceType;
    assert(identifier <= MAX_NONCE_IDENTIFIER);
    this.identifier = identifier;
  }

  public static fromHex(hexMetadata: Hex): DaimoNonceMetadata | undefined {
    assert(hexMetadata.length === 16 + 2);
    const nonceType = parseInt(hexMetadata.slice(2, 4), 16);
    if (!(nonceType in DaimoNonceType) || nonceType === DaimoNonceType.MAX)
      return undefined;
    const identifier = BigInt("0x" + hexMetadata.slice(4)) as bigint;
    return new DaimoNonceMetadata(nonceType, identifier);
  }

  public toHex(): Hex {
    const hexNonceType = numberToHex(this.nonceType, { size: 1 });
    const hexIdentifier = numberToHex(this.identifier, { size: 7 }).slice(2);
    return (hexNonceType + hexIdentifier) as Hex;
  }
}

function assert(condition: boolean) {
  if (!condition) throw new Error("Assertion failed");
}

export function generateRandom256BitInteger(): bigint {
  const buffer = new Uint8Array(32); // 256 bits = 32 bytes
  crypto.getRandomValues(buffer);

  let result = 0n;
  for (let i = 0; i < buffer.length; i++) {
    result = (result << 8n) | BigInt(buffer[i]);
  }

  return result;
}
