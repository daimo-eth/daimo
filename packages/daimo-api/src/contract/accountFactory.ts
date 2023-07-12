import { accountFactoryConfig } from "@daimo/contract";
import { Hex, getContract } from "viem";

import { ContractType, ViemClient } from "../chain";

/* Interface to the AccountFactory contract. Creates Daimo accounts. */
export class AccountFactory {
  contract: ContractType<typeof accountFactoryConfig.abi>;

  constructor(private vc: ViemClient) {
    this.contract = getContract({ ...accountFactoryConfig, ...this.vc });
  }

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
    const deployArgs = [[key1, key2], salt] as const;
    const hash = await this.contract.write.createAccount(deployArgs);
    console.log(`[API] deploy transaction ${hash}`);

    const { publicClient } = this.vc;
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[API] deploy transaction ${receipt.status}`);
    if (receipt.status !== "success") {
      return { status: "reverted" as const };
    }

    // Compute CREATE2 deployment address
    // TODO: would prefer to just execute, but viem does support return values
    const address = await this.contract.read.getAddress([[key1, key2], salt]);

    return { status: "success" as const, address };
  }
}
