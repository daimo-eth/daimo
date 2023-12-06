import {
  ChainGasConstants,
  EAccount,
  UserOpHex,
  assert,
  assertNotNull,
} from "@daimo/common";
import { daimoChainFromId, daimoPaymasterAddress } from "@daimo/contract";
import {
  Hex,
  concatHex,
  hexToBigInt,
  hexToBytes,
  keccak256,
  numberToHex,
  toHex,
} from "viem";
import { sign } from "viem/accounts";

import { DB } from "../db/db";
import { chainConfig } from "../env";
import { BundlerClient } from "../network/bundlerClient";
import { ViemClient, getEOA } from "../network/viemClient";
import { retryBackoff } from "../utils/retryBackoff";

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
    this.db.insertPaymasterWhiteslist(name);
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
    const estimatedPreVerificationGas = await retryBackoff(
      "estimate-preverification-gas",
      () => this.bundlerClient.estimatePreVerificationGas(getDummyOp())
    );

    const maxFeePerGas = hexToBigInt(gasPriceParams.maxFeePerGas);
    const maxPriorityFeePerGas = hexToBigInt(
      gasPriceParams.maxPriorityFeePerGas
    );
    const preVerificationGas = estimatedPreVerificationGas;

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
      sender.name != null &&
      (await this.db.checkPaymasterWhitelist(sender.name));
    const paymasterAndData = isSponsored
      ? await getPaymasterWithSignature(sender)
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
}

const signerPrivateKey = assertNotNull(
  process.env.DAIMO_PAYMASTER_SIGNER_PRIVATE_KEY,
  "Missing DAIMO_PAYMASTER_SIGNER_PRIVATE_KEY"
) as Hex;
const signer = getEOA(signerPrivateKey);

async function getPaymasterWithSignature(sender: EAccount): Promise<Hex> {
  const validUntil = (Date.now() / 1000 + 5 * 60) | 0; // 5 minute validity
  const validUntilHex = numberToHex(validUntil, { size: 6 });
  const ticketHex = concatHex([sender.addr, validUntilHex]);
  assert(hexToBytes(ticketHex).length === 26, "paymaster: invalid ticket len");
  const ticketHash = keccak256(ticketHex);
  console.log(`[PAYMASTER] sign ${ticketHex} with ${signer.address}`);

  const sig = await sign({ hash: ticketHash, privateKey: signerPrivateKey });
  const sigHex = concatHex([
    toHex(sig.v, { size: 1 }),
    toHex(hexToBigInt(sig.r), { size: 32 }),
    toHex(hexToBigInt(sig.s), { size: 32 }),
  ]);
  assert(sigHex.length === 65 * 2 + 2, "paymaster: invalid sig length");

  // Experimentally try the new MetaPaymaster-sponsored Daimo paymaster.
  const paymasterAddr =
    sender.name === "dcposch" || sender.name!.startsWith("test")
      ? daimoPaymasterAddress
      : "0x6f0F82fAFac7B5D8C269B02d408F094bAC6CF877";

  const ret = concatHex([paymasterAddr, sigHex, validUntilHex]);
  assert(ret.length === 91 * 2 + 2, "paymaster: invalid ret length");
  return ret;
}

function getDummyOp(): UserOpHex {
  return dummyAddDeviceOps[daimoChainFromId(chainConfig.chainL2.id)];
}

// Arbitrary add device ops used for gas estimation via Pimlico.
const dummyAddDeviceOps = {
  base: {
    sender: "0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D",
    nonce: "0xd642bab777d7280fcaa3d46d12f2294c0000000000000000",
    initCode: "0x",
    callData:
      "0x34fcd5be000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0x493e0",
    verificationGasLimit: "0xaae60",
    preVerificationGas: "0xf4240",
    maxFeePerGas: "0xa76aa9",
    maxPriorityFeePerGas: "0xa76aa9",
    paymasterAndData: "0x939263eafe57038a072cb4edd6b25dd81a8a6c56",
    signature:
      "0x010000655d836301000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000170000000000000000000000000000000000000000000000000000000000000001ae451cfd35ad2d0b611f9c6a6b782e9dc102c8b6864b4d159ff9bf6f6ba1dbd0698430a4f67db38a250ad441a0dbf639b850d1697c4b269c0e4337436d51c313000000000000000000000000000000000000000000000000000000000000002500000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22415141415a56324459397a6977776f6e4473445859703875356f4638546b4653466f383971744e5a3463315166304d42692d7073227d000000000000",
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
} as const;
