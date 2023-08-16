import { assert } from "@daimo/common";
import { Hex, numberToHex } from "viem";
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

  public static fromHex(nonce: Hex): DaimoNonce {
    const hexMetadata = nonce.slice(0, 2 + 16) as Hex;
    const metadata = DaimoNonceMetadata.fromHex(hexMetadata);
    const key = `0x${nonce.slice(2 + 16, 2 + 16 + 32)}` as Hex;
    return new DaimoNonce(metadata, key);
  }
}

export class DaimoNonceMetadata {
  public static fromHex(hexMetadata: Hex): DaimoNonceMetadata {
    assert(hexMetadata.length === 16 + 2);
    return new DaimoNonceMetadata();
  }

  public toHex(): Hex {
    return numberToHex(0, { size: 8 });
  }
}
