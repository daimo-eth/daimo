import { derKeytoContractFriendlyKey, DaimoAccountCall } from "@daimo/common";
import { daimoAccountFactoryConfig } from "@daimo/contract";
import { Hex, TransactionReceipt } from "viem";

import { ViemClient } from "../network/viemClient";

const SALT = 0n; // Daimo Account Factory salt, always 0.

/* Interface to the DaimoAccountFactory contract. Creates Daimo accounts. */
export class AccountFactory {
  constructor(private vc: ViemClient) {}

  /**
   * Takes a DER P256 public key.
   * Returns the CREATE2 deployment address for Daimo account with that as it's initial signing key.
   * We don't use Entrypoint's getSenderAddress because it's too complicated. Daimo Accounts have a
   * simpler getAddress function that we can use instead.
   */
  async getAddress(pubKeyHex: Hex, initCalls: DaimoAccountCall[]) {
    const address = await this.vc.publicClient.readContract({
      ...daimoAccountFactoryConfig,
      functionName: "getAddress",
      args: [0, derKeytoContractFriendlyKey(pubKeyHex), initCalls, SALT],
    });
    return address;
  }

  /**
   * Takes a DER P256 public key.
   * Deploys a new Daimo account with that as it's initial signing key.
   */
  async deploy(
    pubKeyHex: Hex,
    initCalls: DaimoAccountCall[]
  ): Promise<TransactionReceipt> {
    const hash = await this.vc.writeContract({
      ...daimoAccountFactoryConfig,
      functionName: "createAccount",
      args: [0, derKeytoContractFriendlyKey(pubKeyHex), initCalls, SALT],
    });
    console.log(`[API] deploy transaction ${hash}`);
    const receipt = await this.vc.publicClient.waitForTransactionReceipt({
      hash,
    });
    console.log(`[API] deploy transaction status ${receipt.status}`);
    return receipt;
  }
}
