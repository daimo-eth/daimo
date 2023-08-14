import { entryPointABI } from "@daimo/contract";
import { Constants } from "userop";
import { Hex } from "viem";

import { ViemClient } from "../chain";

const entryPointAddr = Constants.ERC4337.EntryPoint as Hex;

/* 4337 EntryPoint. Prefunds Daimo accounts, as a stopgap till we have a paymaster. */
export class EntryPoint {
  constructor(private vc: ViemClient) {}

  /** Prefunds an account's gas, depositing ETH with the EntryPoint. */
  async prefundEth(address: Hex, value: bigint) {
    const depositTxHash = await this.vc.walletClient.writeContract({
      abi: entryPointABI,
      address: entryPointAddr,
      functionName: "depositTo",
      args: [address],
      value,
    });
    console.log(`[API] faucet prefund: ${depositTxHash}`);

    const receipt = await this.vc.publicClient.waitForTransactionReceipt({
      hash: depositTxHash,
      timeout: 30000,
    });
    console.log(`[API] faucet prefund ${receipt.status}`);
  }
}
