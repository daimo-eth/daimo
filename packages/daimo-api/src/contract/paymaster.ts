import { UserOpHex } from "@daimo/common";
import { daimoChainFromId, daimoPaymasterAddress } from "@daimo/contract";

import { chainConfig } from "../env";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient } from "../network/viemClient";

/* Interface to on-chain paymaster and gas related data. */
export class Paymaster {
  /* Gas price constants */
  private maxFeePerGas: bigint = 0n;
  private maxPriorityFeePerGas: bigint = 0n;

  /* Estimated pre-verification gas to use for Daimo userops.
   * Currently, adding a new key is the most expensive userop since it
   * has the most calldata. So we use the pre-verification gas estimate for that
   * as a conservative estimate for all userops.
   */
  private preVerificationGas: bigint = 0n;

  /* Pimlico Paymaster constants */
  private priceMarkup: bigint = 0n;
  private previousPrice: bigint = 0n;

  /* Estimated fee in dollars (2 digits after decimal) */
  private estimatedFee = 0;

  /* Last time we fetched the above constants */
  private lastFetchTs = 0;

  constructor(private vc: ViemClient, private bundlerClient: BundlerClient) {}

  async init() {
    this.fetchLatestState();
  }

  // Since our various gas limits corresponding to the userop are nearly fixed,
  // we can compute these constants as a pure function of current on-chain state.
  // TODO: track history of different type of userops for precision.
  estimatePimlicoFee() {
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

    // Pimlico Paymaster constants, disabled fetching for now.
    // const priceMarkup = await this.vc.publicClient.readContract({
    //   abi: pimlicoPaymasterAbi,
    //   address: chainConfig.paymasterAddress,
    //   functionName: "priceMarkup",
    // });
    // const previousPrice = await this.vc.publicClient.readContract({
    //   abi: pimlicoPaymasterAbi,
    //   address: chainConfig.paymasterAddress,
    //   functionName: "previousPrice",
    // });

    const maxFeePerGas = await this.vc.publicClient.getGasPrice();
    const maxPriorityFeePerGas =
      await this.vc.publicClient.estimateMaxPriorityFeePerGas(); // Assumes we're on an EIP-1559 chain
    const estimatedPreVerificationGas =
      await this.bundlerClient.estimatePreVerificationGas(
        dummyAddDeviceOps[daimoChainFromId(chainConfig.chainL2.id)]
      );

    this.maxFeePerGas = maxFeePerGas;
    this.maxPriorityFeePerGas = maxPriorityFeePerGas;
    this.preVerificationGas = estimatedPreVerificationGas;
    this.estimatedFee = 0;
  }

  // Leftover gas payment is refunded by the paymaster so overpaying is fine.
  async calculateChainGasConstants() {
    await this.fetchLatestState();

    return {
      maxPriorityFeePerGas: this.maxPriorityFeePerGas.toString(),
      maxFeePerGas: this.maxFeePerGas.toString(),
      estimatedFee: this.estimatedFee,
      preVerificationGas: this.preVerificationGas.toString(),
      paymasterAddress: daimoPaymasterAddress,
    };
  }
}

type DummyAddDeviceOps = {
  base: UserOpHex;
  baseGoerli: UserOpHex;
};

// Arbitrary add device ops used for gas estimation via Pimlico.
const dummyAddDeviceOps: DummyAddDeviceOps = {
  base: {
    sender: "0xcF8978ef8ae37eaFcD946d4Ec1794359F0FF22fc",
    nonce: "0x400000000000000f0a50b7d25438c0b33ea39957918f17d0000000000000000",
    initCode: "0x",
    callData:
      "0x34fcd5be000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000cf8978ef8ae37eafcd946d4ec1794359f0ff22fc000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064b3033ef2000000000000000000000000000000000000000000000000000000000000000265a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e44a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f43700000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0x493e0",
    verificationGasLimit: "0xaae60",
    preVerificationGas: "0x5208",
    maxFeePerGas: "0x5f5e13e",
    maxPriorityFeePerGas: "0x5f5e100",
    paymasterAndData: "0x99d720cd5a04c16dc5377638e3f6d609c895714f",
    signature:
      "0x0100000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000159fd24838af53cc03072b031622099e948399afa57cc4b47ccc89eb5f4903c34089e6b23bcffb50429a95ca04e66f8a1fc04a44c8bd5bc90a7656c6657cb3306000000000000000000000000000000000000000000000000000000000000002500000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a224151414141414141414b7839454a70374f2d305f744838376f3433375749494d45455936707565486d2d675f4c7271666d794b35222c226f726967696e223a226461696d6f2e78797a227d0000000000000000000000000000000000",
  },
  baseGoerli: {
    sender: "0xCaa88b53CDDF460Abf96D9C57F3714fB25A0738c",
    nonce: "0x4000000000000005c6fba6fbe829ece85acfcfe949005b00000000000000000",
    initCode: "0x",
    callData:
      "0x34fcd5be000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000caa88b53cddf460abf96d9c57f3714fb25a0738c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064b3033ef2000000000000000000000000000000000000000000000000000000000000000165a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e44a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f43700000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0x493e0",
    verificationGasLimit: "0xaae60",
    preVerificationGas: "0x5208",
    maxFeePerGas: "0x5f5e132",
    maxPriorityFeePerGas: "0x5f5e100",
    paymasterAndData: "0x99d720cd5a04c16dc5377638e3f6d609c895714f",
    signature:
      "0x0100000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000170000000000000000000000000000000000000000000000000000000000000001a9650c1d0cb868523031addedbe9b9dd1c8ddf0b5c7baf2ff98db6d84e540bf67d7cda1288328f086a71afd22edd1fcde6aad5f6ee63e937f5026aac51928eea000000000000000000000000000000000000000000000000000000000000002500000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2241514141414141414145314b5242393839756a5173752d56736a57394f3038737a4f304f6165662d68615f682d51585445746251222c226f726967696e223a226461696d6f2e78797a227d0000000000000000000000000000000000",
  },
};
