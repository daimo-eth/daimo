import { entryPointABI } from "@daimo/contract";
import { Constants } from "userop";
import { Hex, getContract } from "viem";

import { ContractType, ViemClient } from "../chain";

/* 4337 EntryPoint. Prefunds Daimo accounts, as a stopgap till we have a paymaster. */
export class EntryPoint {
  contract: ContractType<typeof entryPointABI>;

  constructor(private vc: ViemClient) {
    this.contract = getContract({
      abi: entryPointABI,
      address: Constants.ERC4337.EntryPoint as Hex,
      ...this.vc,
    });
  }

  /** Prefunds an account's gas, depositing ETH with the EntryPoint. */
  async prefundEth(address: Hex, value: bigint) {
    const { write } = this.contract;
    const depositTxHash = await write.depositTo([address], { value });
    console.log(`[API] faucet prefund: ${depositTxHash}`);

    const receipt = await this.vc.publicClient.waitForTransactionReceipt({
      hash: depositTxHash,
      timeout: 30000,
    });
    console.log(`[API] faucet prefund ${receipt.status}`);
  }
}
