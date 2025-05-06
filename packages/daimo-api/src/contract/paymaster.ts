import { ChainGasConstants, EAccount, retryBackoff } from "@daimo/common";
import { daimoPaymasterV2Address } from "@daimo/contract";
import { hexToBigInt } from "viem";

import { DB } from "../db/db";
import { chainConfig } from "../env";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient } from "../network/viemClient";

interface GasPrices {
  /// L2 fee
  maxFeePerGas: bigint;
  /// L2 recommended priority fee
  maxPriorityFeePerGas: bigint;
  /// Covers L1 data cost @ current L1 fees
  preVerificationGas: bigint;
}

/* Interface to on-chain paymaster and gas related data. */
export class Paymaster {
  private latestGasPrices?: GasPrices;

  constructor(
    private vc: ViemClient,
    private bundlerClient: BundlerClient,
    private db: DB
  ) {}

  async init() {
    console.log(`[PAYMASTER] init`);
    this.latestGasPrices = await this.fetchGasPrices();

    setInterval(async () => {
      console.log(`[PAYMASTER] refreshing gas prices...`);
      this.latestGasPrices = await this.fetchGasPrices();
    }, 1000 * 60);
  }

  addToWhitelist(name: string) {
    // Run in background, don't await
    retryBackoff(`insertPaymasterWhiteslist`, () =>
      this.db.insertPaymasterWhiteslist(name)
    );
  }

  // Since our various gas limits corresponding to the userop are nearly fixed,
  // we can compute these constants as a pure function of current on-chain state.
  // TODO: track history of different type of userops for precision.
  // estimatePimlicoFee() {
  //   // This is exactly what Pimlico's paymaster SDK does:
  //   // https://github.com/pimlicolabs/erc20-paymaster-contracts/blob/master/sdk/ERC20Paymaster.ts#L223
  //   // without the 3x multiplier on verification gas limit (that it adds due some postOp edge case).
  //   // We do not use their SDK to save fetches.

  //   const expectedPreVerificationCost = 40_000n;
  //   const expectedVerificationCost = 400_000n;
  //   const expectedCallCost = 160_000n;
  //   const expectedRefundCost = 40_000n; // REFUND_POSTOP_COST constant

  //   const expectedFunding =
  //     (expectedPreVerificationCost +
  //       expectedVerificationCost +
  //       expectedCallCost +
  //       expectedRefundCost) *
  //     this.maxFeePerGas;

  //   const tokenAmount =
  //     (expectedFunding * this.priceMarkup * this.previousPrice) / 10n ** 24n; // 1e24 = 1e6 * 1e18, 1e6 is the priceDenominator constant, 1e18 is number of ETH decimals
  //   const dollars =
  //     Number((tokenAmount * 100n) / 10n ** BigInt(chainConfig.tokenDecimals)) /
  //     100; // normalize to dollars with 2 digits after decimal
  //   return dollars;
  // }

  private async fetchGasPrices(): Promise<GasPrices> {
    // Pimlico Paymaster gas estimation.
    // const priceMarkup = await this.vc.publicClient.readContract({
    //   abi: pimlicoPaymasterAbi,
    //   address: chainConfig.pimlicoPaymasterAddress,
    //   functionName: "priceMarkup",
    // });
    // const previousPrice = await this.vc.publicClient.readContract({
    //   abi: pimlicoPaymasterAbi,
    //   address: chainConfig.pimlicoPaymasterAddress,
    //   functionName: "previousPrice",
    // });
    // this.priceMarkup = BigInt(priceMarkup);
    // this.previousPrice = previousPrice;

    const gasPriceParams = await retryBackoff(
      "get-user-operation-gas-price-params",
      () => this.bundlerClient.getUserOperationGasPriceParams()
    );

    const maxFeePerGas = hexToBigInt(gasPriceParams.maxFeePerGas);
    const maxPriorityFeePerGas = hexToBigInt(
      gasPriceParams.maxPriorityFeePerGas
    );
    const preVerificationGas = calcPreVerificationGas();

    // this.estimatedFee = this.estimatePimlicoFee();

    console.log(
      `[PAYMASTER] fetched latest gas prices: ${JSON.stringify({
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        preVerificationGas: preVerificationGas.toString(),
      })}`
    );

    return { maxFeePerGas, maxPriorityFeePerGas, preVerificationGas };
  }

  // Leftover gas payment is refunded by the paymaster so overpaying is fine.
  async calculateChainGasConstants(
    sender: EAccount
  ): Promise<ChainGasConstants> {
    // Sign paymaster for any valid Daimo account, excluding name blacklist.
    // Everyone else gets the Pimlico USDC paymaster.
    const isSponsored =
      chainConfig.chainL2.testnet || (await this.shouldSponsor(sender.name));
    const paymasterAndData = isSponsored
      ? daimoPaymasterV2Address
      : chainConfig.pimlicoPaymasterAddress;

    // TODO: estimate real Pimlico fee for non-sponsored ops.
    const estimatedFee = isSponsored ? 0 : 0.1;

    const gas = this.latestGasPrices;
    if (gas == null) throw new Error("No gas prices. Fetch failed?");

    return {
      estimatedFee,
      paymasterAddress: paymasterAndData,

      maxPriorityFeePerGas: gas.maxPriorityFeePerGas.toString(),
      maxFeePerGas: gas.maxFeePerGas.toString(),
      preVerificationGas: gas.preVerificationGas.toString(),
    };
  }

  async shouldSponsor(name?: string): Promise<boolean> {
    if (name == null) return false;
    return await retryBackoff(`checkPaymasterWhitelist`, () =>
      this.db.checkPaymasterWhitelist(name!)
    );
  }
}

function calcPreVerificationGas() {
  return 1_000_000n; // TODO
}
