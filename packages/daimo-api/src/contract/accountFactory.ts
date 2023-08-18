import { accountFactoryConfig } from "@daimo/contract";
import { Hex, TransactionReceipt } from "viem";

import { ViemClient } from "../chain";

/* Interface to the AccountFactory contract. Creates Daimo accounts. */
export class AccountFactory {
  constructor(private vc: ViemClient) {}

  /**
   * Takes a DER P256 public key.
   * Returns the contract friendly raw key args.
   */
  computeContractArgs = (pubKeyHex: string) => {
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
    return args;
  };

  /**
   * Takes a DER P256 public key.
   * Returns the CREATE2 deployment address for Daimo account with that as it's initial signing key.
   * We don't use Entrypoint's getSenderAddress because it's too complicated. Daimo Accounts have a
   * simpler getAddress function that we can use instead.
   */
  async getAddress(pubKeyHex: string) {
    const address = await this.vc.publicClient.readContract({
      ...accountFactoryConfig,
      functionName: "getAddress",
      args: this.computeContractArgs(pubKeyHex),
    });
    return address;
  }

  /**
   * Takes a DER P256 public key.
   * Deploys a new Daimo account with that as it's initial signing key.
   */
  async deploy(pubKeyHex: string): Promise<TransactionReceipt> {
    const hash = await this.vc.walletClient.writeContract({
      ...accountFactoryConfig,
      functionName: "createAccount",
      args: this.computeContractArgs(pubKeyHex),
    });
    console.log(`[API] deploy transaction ${hash}`);
    const receipt = await this.vc.publicClient.waitForTransactionReceipt({
      hash,
    });
    console.log(`[API] deploy transaction status ${receipt.status}`);
    return receipt;
  }
}
