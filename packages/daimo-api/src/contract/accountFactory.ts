import { accountFactoryConfig } from "@daimo/contract";
import { Hex } from "viem";

import { ViemClient } from "../chain";

/* Interface to the AccountFactory contract. Creates Daimo accounts. */
export class AccountFactory {
  constructor(private vc: ViemClient) {}
  /**
   * Takes a DER P256 public key.
   * Deploys a new Daimo account with that as it's initial signing key.
   */
  async deploy(pubKeyHex: string) {
    const derPrefix =
      "0x3059301306072a8648ce3d020106082a8648ce3d03010703420004";
    if (!pubKeyHex.startsWith(derPrefix)) {
      throw new Error("Invalid public key format");
    }

    const pubKey = Buffer.from(pubKeyHex.substring(derPrefix.length), "hex");
    if (pubKey.length !== 64) {
      throw new Error("Invalid public key, wrong length");
    }

    const key1 = `0x${pubKey.subarray(0, 32).toString("hex")}` as Hex;
    const key2 = `0x${pubKey.subarray(32).toString("hex")}` as Hex;
    const salt = 0n;
    const args = [[key1, key2], salt] as const;

    // Deploy account
    const hash = await this.vc.walletClient.writeContract({
      ...accountFactoryConfig,
      functionName: "createAccount",
      args,
    });
    console.log(`[API] deploy transaction ${hash}`);
    const tx = await this.vc.publicClient.waitForTransactionReceipt({ hash });
    console.log(`[API] deploy transaction ${tx.status}`);
    if (tx.status !== "success") {
      return { status: "reverted" as const, address: undefined };
    }

    // Compute CREATE2 deployment address
    const address = await this.vc.publicClient.readContract({
      ...accountFactoryConfig,
      functionName: "getAddress",
      args,
    });

    return { status: "success" as const, address };
  }
}
