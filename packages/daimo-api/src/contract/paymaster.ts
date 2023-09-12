import {
  DEFAULT_USEROP_PREVERIFICATION_GAS_LIMIT,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
} from "@daimo/common";
import { tokenMetadata } from "@daimo/contract";
import { concat, pad, parseAbi, toHex } from "viem";

import { ViemClient } from "../chain";

const pimlicoPaymasterAbi = parseAbi([
  "function priceMarkup() view returns (uint32)",
  "function previousPrice() view returns (uint192)",
]);

/* Interface to on-chain paymaster and gas related data. */
export class Paymaster {
  /* Gas price constants */
  private maxFeePerGas: bigint = 0n;
  private maxPriorityFeePerGas: bigint = 0n;

  /* Paymaster constants */
  private priceMarkup: bigint = 0n;
  private previousPrice: bigint = 0n;

  private lastFetchDT: Date = new Date(0);

  constructor(private vc: ViemClient) {}

  async init() {
    this.fetchLatestState();
  }

  private async fetchLatestState() {
    // Do not fetch more than once per 5 minute for now.
    // todo: Ask Pimlico to change contract to emit events on updates
    // todo: fetch fees seperately on higher frequency
    if (new Date().getTime() - this.lastFetchDT.getTime() < 5 * 60 * 1000)
      return;

    const priceMarkup = await this.vc.publicClient.readContract({
      abi: pimlicoPaymasterAbi,
      address: tokenMetadata.paymasterAddress,
      functionName: "priceMarkup",
    });
    const previousPrice = await this.vc.publicClient.readContract({
      abi: pimlicoPaymasterAbi,
      address: tokenMetadata.paymasterAddress,
      functionName: "previousPrice",
    });

    const maxFeePerGas = await this.vc.publicClient.getGasPrice();
    const maxPriorityFeePerGas =
      await this.vc.publicClient.estimateMaxPriorityFeePerGas(); // Assumes we're on an EIP-1559 chain

    this.lastFetchDT = new Date();
    this.priceMarkup = BigInt(priceMarkup);
    this.previousPrice = previousPrice;
    this.maxFeePerGas = maxFeePerGas;
    this.maxPriorityFeePerGas = maxPriorityFeePerGas;
  }

  // Since our various gas limits corresponding to the userop are fixed, we can
  // compute these constants as a pure function.
  // Leftover gas payment is refunded by the paymaster so overpaying is fine.
  async calculateChainGasConstants() {
    await this.fetchLatestState();

    // This is exactly what Pimlico's paymaster SDK does:
    // https://github.com/pimlicolabs/erc20-paymaster-contracts/blob/master/sdk/ERC20Paymaster.ts#L223
    // but we do not use their SDK to save fetches.

    const requiredPreFund =
      (DEFAULT_USEROP_PREVERIFICATION_GAS_LIMIT +
        DEFAULT_USEROP_VERIFICATION_GAS_LIMIT * 3n + // 3 is for buffer when using paymaster
        DEFAULT_USEROP_CALL_GAS_LIMIT) *
      this.maxFeePerGas;

    const refundCost = this.maxFeePerGas * 40000n; // 40000 is the REFUND_POSTOP_COST constant

    const tokenAmount =
      ((requiredPreFund + refundCost) * this.priceMarkup * this.previousPrice) /
      10n ** 24n; // 1e24 = 1e6 * 1e18, 1e6 is the priceDenominator constant, 1e18 is number of ETH decimals

    const paymasterAndData = concat([
      tokenMetadata.paymasterAddress,
      pad(toHex(tokenAmount)),
    ]);

    return {
      paymasterAndData,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas.toString(),
      maxFeePerGas: this.maxFeePerGas.toString(),
    };
  }
}
