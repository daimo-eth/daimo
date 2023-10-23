import {
  chainConfig,
  pimlicoPaymasterAbi,
  daimoPaymasterAddress,
} from "@daimo/contract";

import { ViemClient } from "../viemClient";

/* Interface to on-chain paymaster and gas related data. */
export class Paymaster {
  /* Gas price constants */
  private maxFeePerGas: bigint = 0n;
  private maxPriorityFeePerGas: bigint = 0n;

  /* Paymaster constants */
  private priceMarkup: bigint = 0n;
  private previousPrice: bigint = 0n;

  /* Estimated fee in dollars (2 digits after decimal) */
  private estimatedFee = 0;

  /* Last time we fetched the above constants */
  private lastFetchTs = 0;

  constructor(private vc: ViemClient) {}

  async init() {
    this.fetchLatestState();
  }

  // Since our various gas limits corresponding to the userop are nearly fixed,
  // we can compute these constants as a pure function of current on-chain state.
  // TODO: track history of different type of userops for precision.
  estimateFee() {
    // This is exactly what Pimlico's paymaster SDK does:
    // https://github.com/pimlicolabs/erc20-paymaster-contracts/blob/master/sdk/ERC20Paymaster.ts#L223
    // without the 3x multiplier on verification gas limit (that it adds due some postOp edge case).
    // We do not use their SDK to save fetches.

    const expectedPreVerificationCost = 40_000n;
    const expectedVerificationCost = 400_000n;
    const expectedCallCost = 160_000n;
    const expectedRefundCost = 40_000n; // REFUND_POSTOP_COST constant

    const expectedFunding =
      (expectedPreVerificationCost +
        expectedVerificationCost +
        expectedCallCost +
        expectedRefundCost) *
      this.maxFeePerGas;

    const tokenAmount =
      (expectedFunding * this.priceMarkup * this.previousPrice) / 10n ** 24n; // 1e24 = 1e6 * 1e18, 1e6 is the priceDenominator constant, 1e18 is number of ETH decimals
    const dollars =
      Number((tokenAmount * 100n) / 10n ** BigInt(chainConfig.tokenDecimals)) /
      100; // normalize to dollars with 2 digits after decimal
    return dollars;
  }

  private async fetchLatestState() {
    // Do not fetch more than once per 5 minute for now.
    // todo: Ask Pimlico to change contract to emit events on updates
    // todo: fetch fees seperately on higher frequency
    if (Date.now() - this.lastFetchTs < 5 * 60 * 1000) return;
    this.lastFetchTs = Date.now();

    const priceMarkup = await this.vc.publicClient.readContract({
      abi: pimlicoPaymasterAbi,
      address: chainConfig.paymasterAddress,
      functionName: "priceMarkup",
    });
    const previousPrice = await this.vc.publicClient.readContract({
      abi: pimlicoPaymasterAbi,
      address: chainConfig.paymasterAddress,
      functionName: "previousPrice",
    });

    const maxFeePerGas = await this.vc.publicClient.getGasPrice();
    const maxPriorityFeePerGas =
      await this.vc.publicClient.estimateMaxPriorityFeePerGas(); // Assumes we're on an EIP-1559 chain

    this.priceMarkup = BigInt(priceMarkup);
    this.previousPrice = previousPrice;
    this.maxFeePerGas = maxFeePerGas;
    this.maxPriorityFeePerGas = maxPriorityFeePerGas;
    this.estimatedFee = this.estimateFee(); // Depends on other constants
  }

  // Leftover gas payment is refunded by the paymaster so overpaying is fine.
  async calculateChainGasConstants() {
    await this.fetchLatestState();

    return {
      maxPriorityFeePerGas: this.maxPriorityFeePerGas.toString(),
      maxFeePerGas: this.maxFeePerGas.toString(),
      estimatedFee: this.estimatedFee,
      paymasterAddress: daimoPaymasterAddress,
    };
  }
}
