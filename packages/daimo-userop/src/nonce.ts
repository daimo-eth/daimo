import { assert } from "@daimo/common";
import { Hex, hexToNumber, numberToHex } from "viem";
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

  public constructor(metadata: DaimoNonceMetadata) {
    const key = generatePrivateKey().slice(32 + 2) as Hex; // Uses secure random.
    this.metadata = metadata;
    this.key = key;
  }

  public toHex(): Hex {
    const hexMetadata = this.metadata.toHex();
    assert(hexMetadata.length === 16 + 2);
    const nonce = (hexMetadata + this.key.slice(2) + "0000000000000000") as Hex;
    console.log(
      `[OP]: Nonce for metadata = ${hexMetadata}, key = ${this.key}: nonce = ${nonce}`
    );
    return nonce;
  }

  public static fromHex(nonce: Hex): DaimoNonce {
    const hexMetadata = nonce.slice(0, 16 + 2) as Hex;
    const metadata = DaimoNonceMetadata.fromHex(hexMetadata);
    return new DaimoNonce(metadata);
  }
}

export class DaimoNonceMetadata {
  public requiresInit: number;
  public constructor(requiresInit: boolean) {
    this.requiresInit = requiresInit ? 1 : 0;
  }

  public static fromHex(hexMetadata: Hex): DaimoNonceMetadata {
    return new DaimoNonceMetadata((hexToNumber(hexMetadata) & 1) === 1);
  }

  public toHex(): Hex {
    return numberToHex(this.requiresInit, { size: 8 });
  }
}

// TODO: add more metadata to track requests for transfers
class DaimoTransferMetadata extends DaimoNonceMetadata {}

class DaimoNoteMetadata extends DaimoNonceMetadata {}
